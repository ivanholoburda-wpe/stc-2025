import { inject, injectable } from 'inversify';
import { DataSource } from 'typeorm';
import type { QueryRunner } from 'typeorm';
import { promises as fs } from 'fs';
import { TYPES } from '../../types';
import { DefaultOptionsSeeder } from '../seeders/OptionsSeeder';

export interface IDatabaseMaintenanceService {
    clearData(): Promise<void>;
    backupDatabase(destinationPath: string): Promise<void>;
    restoreDatabase(sourcePath: string): Promise<void>;
}

@injectable()
export class DatabaseMaintenanceService implements IDatabaseMaintenanceService {
    constructor(
        @inject(TYPES.DataSource) private readonly dataSource: DataSource,
        @inject(TYPES.DefaultOptionsSeeder) private readonly defaultOptionsSeeder: DefaultOptionsSeeder,
    ) {}

    public async clearData(): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.query('PRAGMA foreign_keys=OFF;');

            for (const entity of this.dataSource.entityMetadatas) {
                const tableName = entity.tableName;
                await queryRunner.query(`DELETE FROM "${tableName}";`);
                await this.resetSqliteSequence(queryRunner, tableName);
            }

            await queryRunner.query('PRAGMA foreign_keys=ON;');
            await queryRunner.query('VACUUM;');
        } catch (error) {
            throw new Error(`[DatabaseMaintenanceService] Failed to clear data: ${(error as Error).message}`);
        } finally {
            await queryRunner.release();
        }

        await this.defaultOptionsSeeder.run();
    }

    public async backupDatabase(destinationPath: string): Promise<void> {
        const databasePath = this.getDatabasePath();
        try {
            await fs.copyFile(databasePath, destinationPath);
        } catch (error) {
            throw new Error(`[DatabaseMaintenanceService] Failed to backup database: ${(error as Error).message}`);
        }
    }

    public async restoreDatabase(sourcePath: string): Promise<void> {
        const databasePath = this.getDatabasePath();
        let copySuccessful = false;

        await this.ensureConnectionClosed();
        try {
            await fs.copyFile(sourcePath, databasePath);
            copySuccessful = true;
        } catch (error) {
            throw new Error(`[DatabaseMaintenanceService] Failed to restore database: ${(error as Error).message}`);
        } finally {
            await this.reinitializeDataSource();
        }

        if (copySuccessful) {
            await this.defaultOptionsSeeder.run();
        }
    }

    private getDatabasePath(): string {
        const database = this.dataSource.options.database;
        if (typeof database !== 'string' || database.length === 0) {
            throw new Error('[DatabaseMaintenanceService] Database path is not configured.');
        }
        return database;
    }

    private async resetSqliteSequence(queryRunner: QueryRunner, tableName: string): Promise<void> {
        try {
            await queryRunner.query(`DELETE FROM sqlite_sequence WHERE name = ?;`, [tableName]);
        } catch (error) {
            const message = (error as Error).message || '';
            if (!message.toLowerCase().includes('no such table: sqlite_sequence')) {
                throw error;
            }
        }
    }

    private async ensureConnectionClosed(): Promise<void> {
        if (this.dataSource.isInitialized) {
            await this.dataSource.destroy();
        }
    }

    private async reinitializeDataSource(): Promise<void> {
        if (!this.dataSource.isInitialized) {
            await this.dataSource.initialize();
        }
        await this.dataSource.runMigrations();
    }
}