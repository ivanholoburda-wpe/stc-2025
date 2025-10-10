import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOptionsTable1760115304556 implements MigrationInterface {
    name = 'AddOptionsTable1760115304556'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "options" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "option_name" varchar NOT NULL, "option_value" varchar)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "options"`);
    }
}
