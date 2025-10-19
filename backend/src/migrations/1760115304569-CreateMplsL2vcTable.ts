import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMplsL2vcTable1762012345678 implements MigrationInterface {
    name = 'CreateMplsL2vcTable1762012345678';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mpls_l2vc"
            (
                "id"                    integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "interface_state"       varchar NOT NULL,
                "session_state"         varchar NOT NULL,
                "vc_id"                 integer NOT NULL,
                "vc_type"               varchar NOT NULL,
                "destination"           varchar NOT NULL,
                "local_label"           integer NOT NULL,
                "remote_label"          integer NOT NULL,
                "local_mtu"             integer NOT NULL,
                "remote_mtu"            integer NOT NULL,
                "primary_tunnel_type"   varchar,
                "primary_tunnel_id"     varchar,
                "backup_tunnel_type"    varchar,
                "backup_tunnel_id"      varchar,
                "create_time"           varchar,
                "up_time"               varchar,
                "last_up_time"          varchar,
                "interface_id"          integer,
                "snapshot_id"           integer,
                "device_id"             integer,

                CONSTRAINT "FK_mpls_l2vc_to_interface" FOREIGN KEY ("interface_id") 
                    REFERENCES "interfaces" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_mpls_l2vc_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_mpls_l2vc_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                
                CONSTRAINT "UQ_mpls_l2vc_unique" UNIQUE ("interface_id", "vc_id", "destination", "device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "mpls_l2vc"`);
    }
}