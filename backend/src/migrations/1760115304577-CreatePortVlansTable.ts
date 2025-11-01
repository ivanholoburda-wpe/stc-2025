import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePortVlansTable1760115304577 implements MigrationInterface {
    name = 'CreatePortVlansTable1760115304577';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "port_vlans"
            (
                "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "port_name"         varchar NOT NULL,
                "link_type"         varchar,
                "pvid"              integer,
                "vlan_list"         varchar,
                "device_id"         integer,
                "snapshot_id"       integer,
                "interface_id"      integer,

                CONSTRAINT "FK_port_vlan_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_port_vlan_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_port_vlan_to_interface" FOREIGN KEY ("interface_id") 
                    REFERENCES "interfaces" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,

                CONSTRAINT "UQ_port_vlan_unique" UNIQUE ("device_id", "snapshot_id", "port_name")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "port_vlans"`);
    }
}

