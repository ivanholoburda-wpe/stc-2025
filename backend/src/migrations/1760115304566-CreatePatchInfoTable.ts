import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePatchInfoTable1760115304566 implements MigrationInterface {
    name = 'CreatePatchInfoTable1760115304566';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "patch_info"
            (
                "id"               integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "patch_exists"     boolean NOT NULL,
                "package_name"     varchar,
                "package_version"  varchar,
                "state"            varchar,
                "details"          text, -- JSON
                "snapshot_id"      integer,
                "device_id"        integer,

                CONSTRAINT "FK_patch_info_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_patch_info_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                
                CONSTRAINT "UQ_patch_info_unique" UNIQUE ("device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "patch_info"`);
    }
}