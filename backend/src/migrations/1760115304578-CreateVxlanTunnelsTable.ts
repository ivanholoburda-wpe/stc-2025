import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVxlanTunnelsTable1761234567894 implements MigrationInterface {
    name = 'CreateVxlanTunnelsTable1761234567894';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "vxlan_tunnels"
            (
                "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "vpn_instance"      varchar NOT NULL,
                "tunnel_id"         integer NOT NULL,
                "source"            varchar NOT NULL,
                "destination"       varchar NOT NULL,
                "state"             varchar,
                "type"              varchar,
                "uptime"            varchar,
                "device_id"         integer,
                "snapshot_id"       integer,

                CONSTRAINT "FK_vxlan_tunnel_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_vxlan_tunnel_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,

                CONSTRAINT "UQ_vxlan_tunnel_unique" UNIQUE ("device_id", "snapshot_id", "vpn_instance", "tunnel_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "vxlan_tunnels"`);
    }
}

