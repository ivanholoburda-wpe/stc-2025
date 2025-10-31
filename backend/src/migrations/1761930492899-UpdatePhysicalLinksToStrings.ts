import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePhysicalLinksToStrings1761930492899 implements MigrationInterface {
    name = 'UpdatePhysicalLinksToStrings1763930492899';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "physical_links"`);

        await queryRunner.query(`
            CREATE TABLE "physical_links"
            (
                "id"                    integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "snapshot_id"           integer,
                "source_device_name"    varchar NOT NULL,
                "source_interface_name" varchar NOT NULL,
                "target_device_name"    varchar NOT NULL,
                "target_interface_name" varchar NOT NULL,

                CONSTRAINT "FK_physical_links_snapshot" FOREIGN KEY ("snapshot_id")
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,

                CONSTRAINT "UQ_physical_links_unique"
                    UNIQUE ("snapshot_id", "source_device_name", "target_device_name")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "physical_links"`);

        await queryRunner.query(`
            CREATE TABLE "physical_links"
            (
                "id"                  integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "snapshot_id"         integer,
                "source_interface_id" integer,
                "target_interface_id" integer,

                CONSTRAINT "FK_link_to_snapshot" FOREIGN KEY ("snapshot_id")
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_link_to_source_interface" FOREIGN KEY ("source_interface_id")
                    REFERENCES "interfaces" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_link_to_target_interface" FOREIGN KEY ("target_interface_id")
                    REFERENCES "interfaces" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,

                CONSTRAINT "UQ_physical_link_unique" UNIQUE ("snapshot_id", "source_interface_id", "target_interface_id")
            )
        `);
    }

}
