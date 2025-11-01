import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVlansTable1761234567892 implements MigrationInterface {
    name = 'CreateVlansTable1761234567892';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "vlans"
            (
                "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "vid"               integer NOT NULL,
                "status"            varchar,
                "property"          varchar,
                "mac_learn"         varchar,
                "statistics"        varchar,
                "description"       varchar,
                "device_id"         integer,
                "snapshot_id"       integer,

                CONSTRAINT "FK_vlan_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_vlan_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,

                CONSTRAINT "UQ_vlan_unique" UNIQUE ("device_id", "snapshot_id", "vid")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "vlans"`);
    }
}

