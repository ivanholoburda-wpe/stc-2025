import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUnusedInterfaceFields1760115304583 implements MigrationInterface {
    name = 'RemoveUnusedInterfaceFields1760115304583';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove unused columns from interfaces table (SQLite doesn't support DROP COLUMN)
        await queryRunner.query(`
            CREATE TABLE "interfaces_new" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "phy_status" varchar,
                "protocol_status" varchar,
                "ip_address" varchar,
                "in_utilization" varchar,
                "out_utilization" varchar,
                "in_errors" integer,
                "out_errors" integer,
                "snapshot_id" integer,
                "device_id" integer,
                CONSTRAINT "FK_interfaces_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_interfaces_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        
        await queryRunner.query(`
            INSERT INTO "interfaces_new" (id, name, phy_status, protocol_status, ip_address, in_utilization, out_utilization, in_errors, out_errors, snapshot_id, device_id)
            SELECT id, name, phy_status, protocol_status, ip_address, in_utilization, out_utilization, in_errors, out_errors, snapshot_id, device_id
            FROM "interfaces"
        `);
        
        await queryRunner.query(`DROP TABLE "interfaces"`);
        await queryRunner.query(`ALTER TABLE "interfaces_new" RENAME TO "interfaces"`);
        
        // Recreate foreign key constraints for transceivers
        await queryRunner.query(`
            CREATE INDEX "IDX_transceivers_interface_id" ON "transceivers" ("interface_id")
        `);
        
        // Remove interface_id foreign key and column from port_vlans table
        await queryRunner.query(`
            CREATE TABLE "port_vlans_new" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "port_name" varchar NOT NULL,
                "link_type" varchar,
                "pvid" integer,
                "vlan_list" varchar,
                "device_id" integer,
                "snapshot_id" integer,
                CONSTRAINT "FK_port_vlan_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_port_vlan_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "UQ_port_vlan_unique" UNIQUE ("device_id", "snapshot_id", "port_name")
            )
        `);
        
        await queryRunner.query(`
            INSERT INTO "port_vlans_new" (id, port_name, link_type, pvid, vlan_list, device_id, snapshot_id)
            SELECT id, port_name, link_type, pvid, vlan_list, device_id, snapshot_id
            FROM "port_vlans"
        `);
        
        await queryRunner.query(`DROP TABLE "port_vlans"`);
        await queryRunner.query(`ALTER TABLE "port_vlans_new" RENAME TO "port_vlans"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore interface_id column and foreign key in port_vlans
        await queryRunner.query(`
            CREATE TABLE "port_vlans_new" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "port_name" varchar NOT NULL,
                "link_type" varchar,
                "pvid" integer,
                "vlan_list" varchar,
                "interface_id" integer,
                "device_id" integer,
                "snapshot_id" integer,
                CONSTRAINT "FK_port_vlan_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_port_vlan_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_port_vlan_to_interface" FOREIGN KEY ("interface_id") 
                    REFERENCES "interfaces" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
                CONSTRAINT "UQ_port_vlan_unique" UNIQUE ("device_id", "snapshot_id", "port_name")
            )
        `);
        
        await queryRunner.query(`
            INSERT INTO "port_vlans_new" (id, port_name, link_type, pvid, vlan_list, device_id, snapshot_id, interface_id)
            SELECT id, port_name, link_type, pvid, vlan_list, device_id, snapshot_id, NULL
            FROM "port_vlans"
        `);
        
        await queryRunner.query(`DROP TABLE "port_vlans"`);
        await queryRunner.query(`ALTER TABLE "port_vlans_new" RENAME TO "port_vlans"`);
        
        // Restore columns in interfaces table
        await queryRunner.query(`
            CREATE TABLE "interfaces_new" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" varchar NOT NULL,
                "phy_status" varchar,
                "protocol_status" varchar,
                "description" varchar,
                "ip_address" varchar,
                "mtu" integer,
                "in_utilization" varchar,
                "out_utilization" varchar,
                "in_errors" integer,
                "out_errors" integer,
                "snapshot_id" integer,
                "device_id" integer,
                CONSTRAINT "FK_interfaces_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_interfaces_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        
        await queryRunner.query(`
            INSERT INTO "interfaces_new" (id, name, phy_status, protocol_status, ip_address, in_utilization, out_utilization, in_errors, out_errors, snapshot_id, device_id, description, mtu)
            SELECT id, name, phy_status, protocol_status, ip_address, in_utilization, out_utilization, in_errors, out_errors, snapshot_id, device_id, NULL, NULL
            FROM "interfaces"
        `);
        
        await queryRunner.query(`DROP TABLE "interfaces"`);
        await queryRunner.query(`ALTER TABLE "interfaces_new" RENAME TO "interfaces"`);
    }
}

