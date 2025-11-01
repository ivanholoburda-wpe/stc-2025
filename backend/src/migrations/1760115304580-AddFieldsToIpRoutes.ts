import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldsToIpRoutes1761234567896 implements MigrationInterface {
    name = 'AddFieldsToIpRoutes1761234567896';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ip_routes" ADD COLUMN "status" varchar`);
        await queryRunner.query(`ALTER TABLE "ip_routes" ADD COLUMN "network" varchar`);
        await queryRunner.query(`ALTER TABLE "ip_routes" ADD COLUMN "prefix_len" integer`);
        await queryRunner.query(`ALTER TABLE "ip_routes" ADD COLUMN "loc_prf" integer`);
        await queryRunner.query(`ALTER TABLE "ip_routes" ADD COLUMN "med" varchar`);
        await queryRunner.query(`ALTER TABLE "ip_routes" ADD COLUMN "pref_val" integer`);
        await queryRunner.query(`ALTER TABLE "ip_routes" ADD COLUMN "path_ogn" varchar`);
        await queryRunner.query(`ALTER TABLE "ip_routes" ADD COLUMN "label" integer`);
        await queryRunner.query(`ALTER TABLE "ip_routes" ADD COLUMN "route_distinguisher" varchar`);
        await queryRunner.query(`ALTER TABLE "ip_routes" ADD COLUMN "vpn_instance" varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ip_routes" DROP COLUMN "vpn_instance"`);
        await queryRunner.query(`ALTER TABLE "ip_routes" DROP COLUMN "route_distinguisher"`);
        await queryRunner.query(`ALTER TABLE "ip_routes" DROP COLUMN "label"`);
        await queryRunner.query(`ALTER TABLE "ip_routes" DROP COLUMN "path_ogn"`);
        await queryRunner.query(`ALTER TABLE "ip_routes" DROP COLUMN "pref_val"`);
        await queryRunner.query(`ALTER TABLE "ip_routes" DROP COLUMN "med"`);
        await queryRunner.query(`ALTER TABLE "ip_routes" DROP COLUMN "loc_prf"`);
        await queryRunner.query(`ALTER TABLE "ip_routes" DROP COLUMN "prefix_len"`);
        await queryRunner.query(`ALTER TABLE "ip_routes" DROP COLUMN "network"`);
        await queryRunner.query(`ALTER TABLE "ip_routes" DROP COLUMN "status"`);
    }
}

