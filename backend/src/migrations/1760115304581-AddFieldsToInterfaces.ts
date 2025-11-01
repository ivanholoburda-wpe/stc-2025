import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldsToInterfaces1760115304581 implements MigrationInterface {
    name = 'AddFieldsToInterfaces1760115304581';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "interfaces" ADD COLUMN "in_utilization" varchar`);
        await queryRunner.query(`ALTER TABLE "interfaces" ADD COLUMN "out_utilization" varchar`);
        await queryRunner.query(`ALTER TABLE "interfaces" ADD COLUMN "in_errors" integer`);
        await queryRunner.query(`ALTER TABLE "interfaces" ADD COLUMN "out_errors" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "interfaces" DROP COLUMN "out_errors"`);
        await queryRunner.query(`ALTER TABLE "interfaces" DROP COLUMN "in_errors"`);
        await queryRunner.query(`ALTER TABLE "interfaces" DROP COLUMN "out_utilization"`);
        await queryRunner.query(`ALTER TABLE "interfaces" DROP COLUMN "in_utilization"`);
    }
}

