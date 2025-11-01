import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVpnInstancesTable1760115304571 implements MigrationInterface {
    name = 'CreateVpnInstancesTable1760115304571';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "vpn_instances"
            (
                "id"               integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name"             varchar NOT NULL,
                "rd"               varchar,
                "address_family"   varchar NOT NULL,
                "snapshot_id"      integer,
                "device_id"        integer,

                CONSTRAINT "FK_vpn_instance_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_vpn_instance_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                
                CONSTRAINT "UQ_vpn_instance_unique" UNIQUE ("name", "address_family", "device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "vpn_instances"`);
    }
}