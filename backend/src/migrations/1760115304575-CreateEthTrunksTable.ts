import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEthTrunksTable1760115304575 implements MigrationInterface {
    name = 'CreateEthTrunksTable1760115304575';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "eth_trunks"
            (
                "id"                    integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "trunk_id"              integer NOT NULL,
                "mode_type"             varchar,
                "working_mode"          varchar,
                "operating_status"      varchar,
                "number_of_up_ports"   integer,
                "local_info"            text,
                "ports_info"            text,
                "device_id"             integer,
                "snapshot_id"           integer,

                CONSTRAINT "FK_eth_trunk_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_eth_trunk_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,

                CONSTRAINT "UQ_eth_trunk_unique" UNIQUE ("device_id", "snapshot_id", "trunk_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "eth_trunks"`);
    }
}

