import { inject, injectable } from 'inversify';
import { dialog } from 'electron';
import { TYPES } from '../types';
import { IDatabaseMaintenanceService } from '../services/maintenance/DatabaseMaintenanceService';

@injectable()
export class MaintenanceHandler {
    constructor(
        @inject(TYPES.DatabaseMaintenanceService) private readonly maintenanceService: IDatabaseMaintenanceService,
    ) {}

    public async clearData() {
        try {
            await this.maintenanceService.clearData();
            return {
                success: true,
                data: {
                    message: 'All application data has been cleared successfully.',
                },
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    public async backupData() {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Save database backup',
            defaultPath: `stc-backup-${Date.now()}.db`,
            filters: [
                { name: 'SQLite Database', extensions: ['db', 'sqlite'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });

        if (canceled || !filePath) {
            return {
                success: false,
                error: 'Backup cancelled by user.',
            };
        }

        try {
            await this.maintenanceService.backupDatabase(filePath);
            return {
                success: true,
                data: {
                    path: filePath,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    public async restoreData() {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: 'Select database backup to restore',
            properties: ['openFile'],
            filters: [
                { name: 'SQLite Database', extensions: ['db', 'sqlite'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });

        const selectedPath = !canceled && filePaths && filePaths.length > 0 ? filePaths[0] : null;
        if (!selectedPath) {
            return {
                success: false,
                error: 'Restore cancelled by user.',
            };
        }

        try {
            await this.maintenanceService.restoreDatabase(selectedPath);
            return {
                success: true,
                data: {
                    message: 'Backup restored successfully.',
                },
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }
}