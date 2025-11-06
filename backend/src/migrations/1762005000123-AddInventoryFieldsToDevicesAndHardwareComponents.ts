import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInventoryFieldsToDevicesAndHardwareComponents1762005000123 implements MigrationInterface {
    name = 'AddInventoryFieldsToDevicesAndHardwareComponents1762005000123';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add backplane fields to devices table
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "backplane_boardtype" varchar`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "backplane_barcode" varchar`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "backplane_item" varchar`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "backplane_description" varchar`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "backplane_manufactured" varchar`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "backplane_vendorname" varchar`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "backplane_issuenumber" varchar`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "backplane_cleicode" varchar`);
        await queryRunner.query(`ALTER TABLE "devices" ADD COLUMN "backplane_bom" varchar`);

        // Add inventory fields to hardware_components table
        await queryRunner.query(`ALTER TABLE "hardware_components" ADD COLUMN "inventory_boardtype" varchar`);
        await queryRunner.query(`ALTER TABLE "hardware_components" ADD COLUMN "inventory_barcode" varchar`);
        await queryRunner.query(`ALTER TABLE "hardware_components" ADD COLUMN "inventory_item" varchar`);
        await queryRunner.query(`ALTER TABLE "hardware_components" ADD COLUMN "inventory_description" varchar`);
        await queryRunner.query(`ALTER TABLE "hardware_components" ADD COLUMN "inventory_manufactured" varchar`);
        await queryRunner.query(`ALTER TABLE "hardware_components" ADD COLUMN "inventory_vendorname" varchar`);
        await queryRunner.query(`ALTER TABLE "hardware_components" ADD COLUMN "inventory_issuenumber" varchar`);
        await queryRunner.query(`ALTER TABLE "hardware_components" ADD COLUMN "inventory_cleicode" varchar`);
        await queryRunner.query(`ALTER TABLE "hardware_components" ADD COLUMN "inventory_bom" varchar`);

        // Create table for daughter boards (multiple per slot)
        await queryRunner.query(`
            CREATE TABLE "inventory_daughter_boards"
            (
                "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "slot_number"       integer NOT NULL,
                "sub_slot"          integer NOT NULL,
                "boardtype"         varchar,
                "barcode"           varchar,
                "item"              varchar,
                "description"       varchar,
                "manufactured"      varchar,
                "vendorname"        varchar,
                "issuenumber"       varchar,
                "cleicode"          varchar,
                "bom"               varchar,
                "device_id"         integer,
                "snapshot_id"       integer,

                CONSTRAINT "FK_inventory_daughter_board_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_inventory_daughter_board_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,

                CONSTRAINT "UQ_inventory_daughter_board_unique" UNIQUE ("device_id", "snapshot_id", "slot_number", "sub_slot")
            )
        `);

        // Create table for ports (multiple per daughter board)
        await queryRunner.query(`
            CREATE TABLE "inventory_ports"
            (
                "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "slot_number"       integer NOT NULL,
                "sub_slot"          integer NOT NULL,
                "port_number"       integer NOT NULL,
                "boardtype"         varchar,
                "barcode"           varchar,
                "item"              varchar,
                "description"       varchar,
                "manufactured"      varchar,
                "vendorname"        varchar,
                "issuenumber"       varchar,
                "cleicode"          varchar,
                "bom"               varchar,
                "device_id"         integer,
                "snapshot_id"       integer,

                CONSTRAINT "FK_inventory_port_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_inventory_port_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,

                CONSTRAINT "UQ_inventory_port_unique" UNIQUE ("device_id", "snapshot_id", "slot_number", "sub_slot", "port_number")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "inventory_ports"`);
        await queryRunner.query(`DROP TABLE "inventory_daughter_boards"`);
        
        await queryRunner.query(`ALTER TABLE "hardware_components" DROP COLUMN "inventory_bom"`);
        await queryRunner.query(`ALTER TABLE "hardware_components" DROP COLUMN "inventory_cleicode"`);
        await queryRunner.query(`ALTER TABLE "hardware_components" DROP COLUMN "inventory_issuenumber"`);
        await queryRunner.query(`ALTER TABLE "hardware_components" DROP COLUMN "inventory_vendorname"`);
        await queryRunner.query(`ALTER TABLE "hardware_components" DROP COLUMN "inventory_manufactured"`);
        await queryRunner.query(`ALTER TABLE "hardware_components" DROP COLUMN "inventory_description"`);
        await queryRunner.query(`ALTER TABLE "hardware_components" DROP COLUMN "inventory_item"`);
        await queryRunner.query(`ALTER TABLE "hardware_components" DROP COLUMN "inventory_barcode"`);
        await queryRunner.query(`ALTER TABLE "hardware_components" DROP COLUMN "inventory_boardtype"`);

        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "backplane_bom"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "backplane_cleicode"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "backplane_issuenumber"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "backplane_vendorname"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "backplane_manufactured"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "backplane_description"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "backplane_item"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "backplane_barcode"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "backplane_boardtype"`);
    }
}

