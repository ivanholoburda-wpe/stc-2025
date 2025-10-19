import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOspfInterfaceDetailsTable1762123456789 implements MigrationInterface {
    name = 'CreateOspfInterfaceDetailsTable1762123456789';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ospf_interface_details"
            (
                "id"                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "ip_address"        varchar NOT NULL,
                "cost"              integer NOT NULL,
                "state"             varchar NOT NULL,
                "type"              varchar NOT NULL,
                "hello_timer"       integer NOT NULL,
                "dead_timer"        integer NOT NULL,
                "retransmit_timer"  integer NOT NULL,
                "bfd_tx_interval"   integer,
                "bfd_rx_interval"   integer,
                "bfd_multiplier"    integer,
                "hello_in"          integer NOT NULL,
                "hello_out"         integer NOT NULL,
                "dbd_in"            integer NOT NULL,
                "dbd_out"           integer NOT NULL,
                "lsr_in"            integer NOT NULL,
                "lsr_out"           integer NOT NULL,
                "lsu_in"            integer NOT NULL,
                "lsu_out"           integer NOT NULL,
                "lsack_in"          integer NOT NULL,
                "lsack_out"         integer NOT NULL,
                "interface_id"      integer,
                "snapshot_id"       integer,
                "device_id"         integer,

                CONSTRAINT "FK_ospf_to_interface" FOREIGN KEY ("interface_id") 
                    REFERENCES "interfaces" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_ospf_to_snapshot" FOREIGN KEY ("snapshot_id") 
                    REFERENCES "snapshots" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_ospf_to_device" FOREIGN KEY ("device_id") 
                    REFERENCES "devices" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                
                CONSTRAINT "UQ_ospf_unique" UNIQUE ("interface_id", "device_id", "snapshot_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "ospf_interface_details"`);
    }
}