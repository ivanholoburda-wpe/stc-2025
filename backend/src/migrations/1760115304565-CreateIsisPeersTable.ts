import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIsisPeersTable1760115304565 implements MigrationInterface {
    name = 'CreateIsisPeersTable1760115304565';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "isis_peers"
            (
                "id"             integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "process_id"     integer NOT NULL,
                "system_id"      varchar NOT NULL,
                "circuit_id"     varchar,
                "state"          varchar NOT NULL,
                "hold_time"      integer NOT NULL,
                "type"           varchar NOT NULL,
                "priority"       integer NOT NULL,
                "interface_id"   integer,
                "snapshot_id"    integer,
                "device_id"      integer,

                CONSTRAINT "FK_isis_peer_to_interface" FOREIGN KEY ("interface_id") 
                    REFERENCES "interfaces" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_isis_peer_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_isis_peer_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                
                CONSTRAINT "UQ_isis_peer_unique" UNIQUE ("interface_id", "system_id", "type", "device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "isis_peers"`);
    }
}