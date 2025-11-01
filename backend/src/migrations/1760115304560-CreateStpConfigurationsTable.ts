import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStpConfigurationsTable1760115304560 implements MigrationInterface {
    name = 'CreateStpConfigurationsTable1760115304560';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "stp_configurations"
            (
                "id"                     integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "protocol_status"        varchar,
                "protocol_standard"      varchar,
                "version"                integer,
                "cist_bridge_priority"   integer,
                "mac_address"            varchar,
                "max_age"                integer,
                "forward_delay"          integer,
                "hello_time"             integer,
                "max_hops"               integer,
                "snapshot_id"            integer,
                "device_id"              integer,

                CONSTRAINT "FK_stp_config_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_stp_config_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                
                CONSTRAINT "UQ_stp_config_unique" UNIQUE ("device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "stp_configurations"`);
    }
}