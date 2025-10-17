import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAlarmsTable1760115304557 implements MigrationInterface {
    
    name = 'CreateAlarmsTable1760115304557' 

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "alarms" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, 
                "index" integer NOT NULL, 
                "level" varchar NOT NULL, 
                "date" datetime NOT NULL DEFAULT (datetime('now')), 
                "time" varchar NOT NULL, 
                "info" varchar NOT NULL, 
                "oid" varchar NOT NULL, 
                "ent_code" integer NOT NULL, 
                "device_id" integer NOT NULL, 
                "snapshot_id" integer NOT NULL, 
                CONSTRAINT "FK_device_id" 
                    FOREIGN KEY ("device_id") 
                    REFERENCES "devices"("id") 
                    ON DELETE NO ACTION,
                CONSTRAINT "FK_snapshot_id" 
                    FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots"("id") 
                    ON DELETE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "alarms"`);
    }

}