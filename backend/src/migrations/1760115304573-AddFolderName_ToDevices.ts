import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFolderName_ToDevices1762456789012 implements MigrationInterface {
    name = 'AddFolderName_ToDevices1762456789012';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_devices"
            (
                "id"                       integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "hostname"                 varchar NOT NULL,
                "model"                    varchar,
                "first_seen_snapshot_id"   integer,
                "folder_name"              varchar NOT NULL, -- Нове поле
                CONSTRAINT "UQ_devices_hostname" UNIQUE ("hostname"),
                CONSTRAINT "UQ_devices_folder_name" UNIQUE ("folder_name"), -- Робимо його унікальним
                CONSTRAINT "FK_devices_first_seen_snapshot" FOREIGN KEY ("first_seen_snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            INSERT INTO "temporary_devices"(id, hostname, model, first_seen_snapshot_id, folder_name)
            SELECT id, hostname, model, first_seen_snapshot_id, hostname 
            FROM "devices"
        `);

        await queryRunner.query(`DROP TABLE "devices"`);

        await queryRunner.query(`ALTER TABLE "temporary_devices" RENAME TO "devices"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_devices"
            (
                "id"                       integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "hostname"                 varchar NOT NULL,
                "model"                    varchar,
                "first_seen_snapshot_id"   integer,
                CONSTRAINT "UQ_devices_hostname" UNIQUE ("hostname"),
                CONSTRAINT "FK_devices_first_seen_snapshot" FOREIGN KEY ("first_seen_snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            INSERT INTO "temporary_devices"(id, hostname, model, first_seen_snapshot_id)
            SELECT id, hostname, model, first_seen_snapshot_id 
            FROM "devices"
        `);

        await queryRunner.query(`DROP TABLE "devices"`);

        await queryRunner.query(`ALTER TABLE "temporary_devices" RENAME TO "devices"`);
    }
}
