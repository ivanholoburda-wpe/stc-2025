import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBgpPeersTable1760115304562 implements MigrationInterface {
    name = 'CreateBgpPeersTable1760115304562';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "bgp_peers"
            (
                "id"               integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "peer_ip"          varchar NOT NULL,
                "address_family"   varchar NOT NULL DEFAULT 'ipv4_unicast',
                "remote_as"        integer NOT NULL,
                "state"            varchar NOT NULL,
                "up_down_time"     varchar,
                "msg_rcvd"         integer NOT NULL,
                "msg_sent"         integer NOT NULL,
                "device_id"        integer,
                "snapshot_id"      integer,

                CONSTRAINT "FK_bgp_peer_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_bgp_peer_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,

                CONSTRAINT "UQ_bgp_peer_unique" UNIQUE ("peer_ip", "address_family", "device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "bgp_peers"`);
    }
}