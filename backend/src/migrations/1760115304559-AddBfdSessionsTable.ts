import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBfdSessionsTable1760115304559 implements MigrationInterface {
    name = 'AddBfdSessionsTable1760115304559';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "bfd_sessions"
            (
                "id"                   integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "local_discriminator"  integer NOT NULL,
                "remote_discriminator" integer NOT NULL,
                "peer_ip_address"      varchar NOT NULL,
                "state"                varchar NOT NULL,
                "type"                 varchar NOT NULL,
                "interface_id"         integer,
                "snapshot_id"          integer,
                "device_id"            integer,
                
                CONSTRAINT "FK_bfd_session_to_interface" FOREIGN KEY ("interface_id") 
                    REFERENCES "interfaces" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_bfd_session_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_bfd_session_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                    
                CONSTRAINT "UQ_bfd_session_unique" UNIQUE ("interface_id", "device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "bfd_sessions"`);
    }
}