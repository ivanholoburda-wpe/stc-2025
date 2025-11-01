import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLicenseInfoTable1760115304568 implements MigrationInterface {
    name = 'CreateLicenseInfoTable1760115304568';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "license_info"
            (
                "id"                    integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "active_license_path"   varchar,
                "state"                 varchar,
                "product_name"          varchar,
                "product_version"       varchar,
                "serial_no"             varchar,
                "creator"               varchar,
                "created_time"          varchar,
                "snapshot_id"           integer,
                "device_id"             integer,

                CONSTRAINT "FK_license_info_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_license_info_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                
                CONSTRAINT "UQ_license_info_unique" UNIQUE ("device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "license_info"`);
    }
}