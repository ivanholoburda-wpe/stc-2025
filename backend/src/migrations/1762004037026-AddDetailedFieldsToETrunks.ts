import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDetailedFieldsToETrunks1762004037026 implements MigrationInterface {
    name = "AddDetailedFieldsToETrunks1762004037026";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("etrunks");
        
        if (!table) {
            console.warn("Table 'etrunks' does not exist. Skipping migration.");
            return;
        }

        const existingColumns = table.columns.map(col => col.name);
        const columnsToAdd = [
            { name: "local_ip", type: "varchar" },
            { name: "interface_name", type: "varchar" },
            { name: "max_active_link_number", type: "integer" },
            { name: "min_active_link_number", type: "integer" },
            { name: "work_mode", type: "varchar" },
            { name: "local_phy_state", type: "varchar" },
            { name: "local_state", type: "varchar" },
            { name: "member_count", type: "integer" },
            { name: "member_type", type: "varchar" },
            { name: "member_id", type: "integer" },
            { name: "member_remote_id", type: "varchar" },
            { name: "member_state", type: "varchar" },
            { name: "member_causation", type: "varchar" },
        ];

        for (const column of columnsToAdd) {
            if (!existingColumns.includes(column.name)) {
                await queryRunner.query(
                    `ALTER TABLE "etrunks" ADD COLUMN "${column.name}" ${column.type}`
                );
            } else {
                console.log(`Column "${column.name}" already exists. Skipping.`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("etrunks");
        
        if (!table) {
            console.warn("Table 'etrunks' does not exist. Skipping rollback.");
            return;
        }

        const existingColumns = table.columns.map(col => col.name);
        const columnsToRemove = [
            "member_causation",
            "member_state",
            "member_remote_id",
            "member_id",
            "member_type",
            "member_count",
            "local_state",
            "local_phy_state",
            "work_mode",
            "min_active_link_number",
            "max_active_link_number",
            "interface_name",
            "local_ip",
        ];

        for (const columnName of columnsToRemove) {
            if (existingColumns.includes(columnName)) {
                await queryRunner.query(
                    `ALTER TABLE "etrunks" DROP COLUMN "${columnName}"`
                );
            }
        }
    }
}

