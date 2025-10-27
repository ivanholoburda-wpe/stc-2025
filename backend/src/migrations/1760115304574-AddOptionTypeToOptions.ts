import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOptionTypeToOptions20240610123456 implements MigrationInterface {
    name = 'AddOptionTypeToOptions20240610123456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("options");
        const hasOptionTypeColumn = table?.columns.some(column => column.name === "option_type");

        if (!hasOptionTypeColumn) {
            await queryRunner.query(`ALTER TABLE "options" ADD COLUMN "option_type" varchar NOT NULL DEFAULT 'text'`);

            await queryRunner.query(`UPDATE "options" SET "option_type" = 'select' WHERE "option_name" = 'mode'`);
            await queryRunner.query(`UPDATE "options" SET "option_type" = 'secret' WHERE "option_name" = 'ai_model_key'`);
            await queryRunner.query(`UPDATE "options" SET "option_type" = 'textarea' WHERE "option_name" = 'ai_prompt_start'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "options_backup" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "option_name" varchar NOT NULL, "option_value" varchar)`);
        await queryRunner.query(`INSERT INTO "options_backup" SELECT "id", "option_name", "option_value" FROM "options"`);
        await queryRunner.query(`DROP TABLE "options"`);
        await queryRunner.query(`ALTER TABLE "options_backup" RENAME TO "options"`);
    }
}
