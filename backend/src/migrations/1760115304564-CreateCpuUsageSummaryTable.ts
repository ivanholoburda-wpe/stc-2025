import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCpuUsageSummaryTable1760115304564 implements MigrationInterface {
    name = 'CreateCpuUsageSummaryTable1760115304564';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "cpu_usage_summaries"
            (
                "id"                            integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "timestamp"                     varchar NOT NULL,
                "system_cpu_use_rate_percent"   integer NOT NULL,
                "cpu_avg"                       text NOT NULL, -- JSON
                "max_cpu_usage_percent"         integer NOT NULL,
                "max_cpu_usage_time"            varchar NOT NULL,
                "service_details"               text NOT NULL, -- JSON
                "snapshot_id"                   integer,
                "device_id"                     integer,

                CONSTRAINT "FK_cpu_summary_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_cpu_summary_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                
                CONSTRAINT "UQ_cpu_summary_unique" UNIQUE ("device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "cpu_usage_summaries"`);
    }
}