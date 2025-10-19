import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHardwareComponentsTable1761234567890 implements MigrationInterface {
    name = 'CreateHardwareComponentsTable1761234567890';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "hardware_components"
            (
                "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "slot"              integer NOT NULL,
                "type"              varchar NOT NULL,
                "model"             varchar,
                "online_status"     varchar,
                "register_status"   varchar,
                "status"            varchar,
                "role"              varchar,
                "primary_status"    varchar,
                "details"           text, -- SQLite uses TEXT for JSON
                "device_id"         integer,
                "snapshot_id"       integer,

                CONSTRAINT "FK_hw_component_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_hw_component_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,

                CONSTRAINT "UQ_hw_component_unique" UNIQUE ("device_id", "snapshot_id", "slot")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "hardware_components"`);
    }
}