import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStorageSummariesTable1761456789012 implements MigrationInterface {
    name = 'CreateStorageSummariesTable1761456789012';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "storage_summaries"
            (
                "id"           integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "total_kb"     integer NOT NULL,
                "free_kb"      integer NOT NULL,
                "total_mb"     float NOT NULL,
                "free_mb"      float NOT NULL,
                "snapshot_id"  integer,
                "device_id"    integer,

                CONSTRAINT "FK_storage_summary_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_storage_summary_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                
                CONSTRAINT "UQ_storage_summary_unique" UNIQUE ("device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "storage_summaries"`);
    }
}