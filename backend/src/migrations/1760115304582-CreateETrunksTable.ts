import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateETrunksTable1760115304582 implements MigrationInterface {
    name = 'CreateETrunksTable1760115304582';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "etrunks"
            (
                "id"                    integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "etrunk_id"             integer NOT NULL,
                "state"                 varchar,
                "vpn_instance"          varchar,
                "peer_ip"               varchar,
                "source_ip"             varchar,
                "priority"              integer,
                "system_id"             varchar,
                "peer_system_id"        varchar,
                "peer_priority"         integer,
                "causation"             varchar,
                "revert_delay_time_s"   integer,
                "send_period_100ms"     integer,
                "fail_time_100ms"       integer,
                "peer_fail_time_100ms"  integer,
                "receive"               integer,
                "send"                  integer,
                "recdrop"               integer,
                "snddrop"               integer,
                "etrunk_info"           text,
                "members"               text,
                "device_id"             integer,
                "snapshot_id"           integer,

                CONSTRAINT "FK_etrunk_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_etrunk_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,

                CONSTRAINT "UQ_etrunk_unique" UNIQUE ("device_id", "snapshot_id", "etrunk_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "etrunks"`);
    }
}

