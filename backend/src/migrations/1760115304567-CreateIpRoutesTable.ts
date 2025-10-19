import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIpRoutesTable1761890123456 implements MigrationInterface {
    name = 'CreateIpRoutesTable1761890123456';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ip_routes"
            (
                "id"                 integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "destination_mask"   varchar NOT NULL,
                "protocol"           varchar NOT NULL,
                "preference"         integer NOT NULL,
                "cost"               integer NOT NULL,
                "flags"              varchar NOT NULL,
                "next_hop"           varchar NOT NULL,
                "device_id"          integer,
                "snapshot_id"        integer,
                "interface_id"       integer,

                CONSTRAINT "FK_ip_route_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_ip_route_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_ip_route_to_interface" FOREIGN KEY ("interface_id") 
                    REFERENCES "interfaces" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
                
                CONSTRAINT "UQ_ip_route_unique" UNIQUE ("destination_mask", "next_hop", "interface_id", "device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "ip_routes"`);
    }
}