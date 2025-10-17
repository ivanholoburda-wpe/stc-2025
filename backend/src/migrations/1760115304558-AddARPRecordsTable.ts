import { MigrationInterface, QueryRunner } from "typeorm";

export class AddARPRecordsTable1760115304558 implements MigrationInterface {
    name = 'AddARPRecordsTable1760115304558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "arp_records" (
                                           "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                           "ip_address" varchar NOT NULL,
                                           "mac_address" varchar NOT NULL,
                                           "expire_m" integer,
                                           "type" varchar,
                                           "interface" varchar,
                                           "vpn_instance" varchar,
                                           "vlan" varchar,
                                           "cevlan" varchar,
                                           "device_id" integer NOT NULL,
                                           "snapshot_id" integer NOT NULL,
                                           CONSTRAINT "FK_arp_device_id" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                           CONSTRAINT "FK_arp_snapshot_id" FOREIGN KEY ("snapshot_id") REFERENCES "snapshots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                           CONSTRAINT "UQ_arp_record_unique" UNIQUE ("ip_address", "snapshot_id", "device_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "arp_records"`);
    }
}