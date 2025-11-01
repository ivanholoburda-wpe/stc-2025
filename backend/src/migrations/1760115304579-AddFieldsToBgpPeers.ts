import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldsToBgpPeers1761234567895 implements MigrationInterface {
    name = 'AddFieldsToBgpPeers1761234567895';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bgp_peers" ADD COLUMN "version" integer`);
        await queryRunner.query(`ALTER TABLE "bgp_peers" ADD COLUMN "out_queue" integer`);
        await queryRunner.query(`ALTER TABLE "bgp_peers" ADD COLUMN "prefixes_received" integer`);
        await queryRunner.query(`ALTER TABLE "bgp_peers" ADD COLUMN "vpn_instance" varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bgp_peers" DROP COLUMN "vpn_instance"`);
        await queryRunner.query(`ALTER TABLE "bgp_peers" DROP COLUMN "prefixes_received"`);
        await queryRunner.query(`ALTER TABLE "bgp_peers" DROP COLUMN "out_queue"`);
        await queryRunner.query(`ALTER TABLE "bgp_peers" DROP COLUMN "version"`);
    }
}

