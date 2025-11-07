import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInventoryViews1762005000124 implements MigrationInterface {
    name = 'CreateInventoryViews1762005000124';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // View для полной информации об устройстве с backplane
        await queryRunner.query(`
            CREATE VIEW IF NOT EXISTS "v_device_inventory_backplane" AS
            SELECT 
                d.id,
                d.folder_name,
                d.hostname,
                d.model,
                d.backplane_boardtype,
                d.backplane_barcode,
                d.backplane_item,
                d.backplane_description,
                d.backplane_manufactured,
                d.backplane_vendorname,
                d.backplane_issuenumber,
                d.backplane_cleicode,
                d.backplane_bom
            FROM devices d
        `);

        // View для hardware components с inventory информацией о main boards
        await queryRunner.query(`
            CREATE VIEW IF NOT EXISTS "v_hardware_component_inventory" AS
            SELECT 
                hc.id,
                hc.device_id,
                hc.snapshot_id,
                hc.slot,
                hc.type,
                hc.model,
                hc.online_status,
                hc.register_status,
                hc.status,
                hc.role,
                hc.primary_status,
                hc.details,
                hc.inventory_boardtype,
                hc.inventory_barcode,
                hc.inventory_item,
                hc.inventory_description,
                hc.inventory_manufactured,
                hc.inventory_vendorname,
                hc.inventory_issuenumber,
                hc.inventory_cleicode,
                hc.inventory_bom
            FROM hardware_components hc
        `);

        // View для daughter boards с информацией об устройстве
        await queryRunner.query(`
            CREATE VIEW IF NOT EXISTS "v_inventory_daughter_boards_full" AS
            SELECT 
                idb.id,
                idb.device_id,
                idb.snapshot_id,
                idb.slot_number,
                idb.sub_slot,
                idb.boardtype,
                idb.barcode,
                idb.item,
                idb.description,
                idb.manufactured,
                idb.vendorname,
                idb.issuenumber,
                idb.cleicode,
                idb.bom,
                d.hostname as device_hostname,
                d.model as device_model
            FROM inventory_daughter_boards idb
            LEFT JOIN devices d ON idb.device_id = d.id
        `);

        // View для ports с информацией о daughter board и устройстве
        await queryRunner.query(`
            CREATE VIEW IF NOT EXISTS "v_inventory_ports_full" AS
            SELECT 
                ip.id,
                ip.device_id,
                ip.snapshot_id,
                ip.slot_number,
                ip.sub_slot,
                ip.port_number,
                ip.boardtype,
                ip.barcode,
                ip.item,
                ip.description,
                ip.manufactured,
                ip.vendorname,
                ip.issuenumber,
                ip.cleicode,
                ip.bom,
                d.hostname as device_hostname,
                d.model as device_model,
                idb.boardtype as daughter_board_boardtype,
                idb.barcode as daughter_board_barcode
            FROM inventory_ports ip
            LEFT JOIN devices d ON ip.device_id = d.id
            LEFT JOIN inventory_daughter_boards idb 
                ON ip.device_id = idb.device_id 
                AND ip.snapshot_id = idb.snapshot_id
                AND ip.slot_number = idb.slot_number
                AND ip.sub_slot = idb.sub_slot
        `);

        // View для полной информации о слоте (hardware component + daughter boards + ports)
        await queryRunner.query(`
            CREATE VIEW IF NOT EXISTS "v_slot_inventory_full" AS
            SELECT 
                hc.id as hardware_component_id,
                hc.device_id,
                hc.snapshot_id,
                hc.slot,
                hc.type as component_type,
                hc.model as component_model,
                hc.status as component_status,
                hc.role as component_role,
                hc.inventory_boardtype as main_board_boardtype,
                hc.inventory_barcode as main_board_barcode,
                hc.inventory_item as main_board_item,
                hc.inventory_description as main_board_description,
                hc.inventory_manufactured as main_board_manufactured,
                hc.inventory_vendorname as main_board_vendorname,
                d.hostname as device_hostname,
                d.model as device_model,
                d.backplane_boardtype,
                d.backplane_barcode,
                COUNT(DISTINCT idb.id) as daughter_boards_count,
                COUNT(DISTINCT ip.id) as ports_count
            FROM hardware_components hc
            LEFT JOIN devices d ON hc.device_id = d.id
            LEFT JOIN inventory_daughter_boards idb 
                ON hc.device_id = idb.device_id 
                AND hc.snapshot_id = idb.snapshot_id
                AND hc.slot = idb.slot_number
            LEFT JOIN inventory_ports ip
                ON idb.device_id = ip.device_id
                AND idb.snapshot_id = ip.snapshot_id
                AND idb.slot_number = ip.slot_number
                AND idb.sub_slot = ip.sub_slot
            GROUP BY 
                hc.id, hc.device_id, hc.snapshot_id, hc.slot, 
                hc.type, hc.model, hc.status, hc.role,
                hc.inventory_boardtype, hc.inventory_barcode, hc.inventory_item,
                hc.inventory_description, hc.inventory_manufactured, hc.inventory_vendorname,
                d.hostname, d.model, d.backplane_boardtype, d.backplane_barcode
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW IF EXISTS "v_slot_inventory_full"`);
        await queryRunner.query(`DROP VIEW IF EXISTS "v_inventory_ports_full"`);
        await queryRunner.query(`DROP VIEW IF EXISTS "v_inventory_daughter_boards_full"`);
        await queryRunner.query(`DROP VIEW IF EXISTS "v_hardware_component_inventory"`);
        await queryRunner.query(`DROP VIEW IF EXISTS "v_device_inventory_backplane"`);
    }
}

