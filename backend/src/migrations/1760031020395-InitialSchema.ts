import {MigrationInterface, QueryRunner} from "typeorm";


export class InitialSchema1760031020395 implements MigrationInterface {
    name = 'InitialSchema1760031020395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "transceivers"
                                 (
                                     "id"             integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "name"           varchar NOT NULL,
                                     "serial_number"  varchar,
                                     "wavelength"     float,
                                     "tx_power"       float,
                                     "rx_power"       float,
                                     "tx_warning_min" float,
                                     "tx_warning_max" float,
                                     "rx_warning_min" float,
                                     "rx_warning_max" float,
                                     "status"         varchar,
                                     "duplex"         varchar,
                                     "type"           varchar,
                                     "mode"           varchar,
                                     "vendor_pn"      varchar,
                                     "lanes"          text,
                                     "interface_id"   integer,
                                     "snapshot_id"    integer,
                                     "device_id"      integer
                                 )`);
        await queryRunner.query(`CREATE TABLE "interfaces"
                                 (
                                     "id"              integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "name"            varchar NOT NULL,
                                     "phy_status"      varchar,
                                     "protocol_status" varchar,
                                     "description"     varchar,
                                     "ip_address"      varchar,
                                     "mtu"             integer,
                                     "snapshot_id"     integer,
                                     "device_id"       integer
                                 )`);
        await queryRunner.query(`CREATE TABLE "device_neighbors"
                                 (
                                     "id"               integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "first_device_id"  integer,
                                     "second_device_id" integer
                                 )`);
        await queryRunner.query(`CREATE TABLE "devices"
                                 (
                                     "id"                     integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "hostname"               varchar NOT NULL,
                                     "model"                  varchar,
                                     "first_seen_snapshot_id" integer
                                 )`);
        await queryRunner.query(`CREATE TABLE "snapshots"
                                 (
                                     "id"               integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "created_at"       datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                                     "root_folder_path" varchar  NOT NULL,
                                     "description"      text
                                 )`);
        await queryRunner.query(`CREATE TABLE "temporary_transceivers"
                                 (
                                     "id"             integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "name"           varchar NOT NULL,
                                     "serial_number"  varchar,
                                     "wavelength"     float,
                                     "tx_power"       float,
                                     "rx_power"       float,
                                     "tx_warning_min" float,
                                     "tx_warning_max" float,
                                     "rx_warning_min" float,
                                     "rx_warning_max" float,
                                     "status"         varchar,
                                     "duplex"         varchar,
                                     "type"           varchar,
                                     "mode"           varchar,
                                     "vendor_pn"      varchar,
                                     "lanes"          text,
                                     "interface_id"   integer,
                                     "snapshot_id"    integer,
                                     "device_id"      integer,
                                     CONSTRAINT "FK_6c4f8fa1d5596b30582fc274744" FOREIGN KEY ("interface_id") REFERENCES "interfaces" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                     CONSTRAINT "FK_77c0105ba056d53eda67a8ca483" FOREIGN KEY ("snapshot_id") REFERENCES "snapshots" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                     CONSTRAINT "FK_dfddd1749826778472511ba6a8f" FOREIGN KEY ("device_id") REFERENCES "devices" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                     CONSTRAINT "UQ_transceiver_interface_snapshot_device" UNIQUE ("interface_id", "snapshot_id", "device_id")
                                 )`);
        await queryRunner.query(`INSERT INTO "temporary_transceivers"("id", "name", "serial_number", "wavelength",
                                                                      "tx_power", "rx_power", "tx_warning_min",
                                                                      "tx_warning_max", "rx_warning_min",
                                                                      "rx_warning_max", "status", "duplex", "type",
                                                                      "mode", "vendor_pn", "lanes", "interface_id",
                                                                      "snapshot_id", "device_id")
                                 SELECT "id",
                                        "name",
                                        "serial_number",
                                        "wavelength",
                                        "tx_power",
                                        "rx_power",
                                        "tx_warning_min",
                                        "tx_warning_max",
                                        "rx_warning_min",
                                        "rx_warning_max",
                                        "status",
                                        "duplex",
                                        "type",
                                        "mode",
                                        "vendor_pn",
                                        "lanes",
                                        "interface_id",
                                        "snapshot_id",
                                        "device_id"
                                 FROM "transceivers"`);
        await queryRunner.query(`DROP TABLE "transceivers"`);
        await queryRunner.query(`ALTER TABLE "temporary_transceivers" RENAME TO "transceivers"`);
        await queryRunner.query(`
            CREATE TABLE "temporary_interfaces"
            (
                "id"              integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name"            varchar NOT NULL,
                "phy_status"      varchar,
                "protocol_status" varchar,
                "description"     varchar,
                "ip_address"      varchar,
                "mtu"             integer,
                "snapshot_id"     integer,
                "device_id"       integer,
                CONSTRAINT "FK_989701670aa21ee22991073a67e" FOREIGN KEY ("snapshot_id") REFERENCES "snapshots" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_85264777155032c7ae29dcbfa40" FOREIGN KEY ("device_id") REFERENCES "devices" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "UQ_interface_name_snapshot_device" UNIQUE ("name", "snapshot_id", "device_id")
            )
        `);
        await queryRunner.query(`INSERT INTO "temporary_interfaces"("id", "name", "phy_status", "protocol_status",
                                                                    "description", "ip_address", "mtu", "snapshot_id",
                                                                    "device_id")
                                 SELECT "id",
                                        "name",
                                        "phy_status",
                                        "protocol_status",
                                        "description",
                                        "ip_address",
                                        "mtu",
                                        "snapshot_id",
                                        "device_id"
                                 FROM "interfaces"`);
        await queryRunner.query(`DROP TABLE "interfaces"`);
        await queryRunner.query(`ALTER TABLE "temporary_interfaces" RENAME TO "interfaces"`);
        await queryRunner.query(`CREATE TABLE "temporary_device_neighbors"
                                 (
                                     "id"               integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "first_device_id"  integer,
                                     "second_device_id" integer,
                                     CONSTRAINT "FK_998a80f2dffd96373700b422bad" FOREIGN KEY ("first_device_id") REFERENCES "devices" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                                     CONSTRAINT "FK_672beb3d8d6fe10a88d448a9716" FOREIGN KEY ("second_device_id") REFERENCES "devices" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
                                 )`);
        await queryRunner.query(`INSERT INTO "temporary_device_neighbors"("id", "first_device_id", "second_device_id")
                                 SELECT "id", "first_device_id", "second_device_id"
                                 FROM "device_neighbors"`);
        await queryRunner.query(`DROP TABLE "device_neighbors"`);
        await queryRunner.query(`ALTER TABLE "temporary_device_neighbors" RENAME TO "device_neighbors"`);
        await queryRunner.query(`CREATE TABLE "temporary_devices"
                                 (
                                     "id"                     integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "hostname"               varchar NOT NULL,
                                     "model"                  varchar,
                                     "first_seen_snapshot_id" integer,
                                     CONSTRAINT "FK_87caa3cfd7a616cbda27518977f" FOREIGN KEY ("first_seen_snapshot_id") REFERENCES "snapshots" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
                                 )`);
        await queryRunner.query(`INSERT INTO "temporary_devices"("id", "hostname", "model", "first_seen_snapshot_id")
                                 SELECT "id", "hostname", "model", "first_seen_snapshot_id"
                                 FROM "devices"`);
        await queryRunner.query(`DROP TABLE "devices"`);
        await queryRunner.query(`ALTER TABLE "temporary_devices" RENAME TO "devices"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "devices" RENAME TO "temporary_devices"`);
        await queryRunner.query(`CREATE TABLE "devices"
                                 (
                                     "id"                     integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "hostname"               varchar NOT NULL,
                                     "model"                  varchar,
                                     "first_seen_snapshot_id" integer
                                 )`);
        await queryRunner.query(`INSERT INTO "devices"("id", "hostname", "model", "first_seen_snapshot_id")
                                 SELECT "id", "hostname", "model", "first_seen_snapshot_id"
                                 FROM "temporary_devices"`);
        await queryRunner.query(`DROP TABLE "temporary_devices"`);
        await queryRunner.query(`ALTER TABLE "device_neighbors" RENAME TO "temporary_device_neighbors"`);
        await queryRunner.query(`CREATE TABLE "device_neighbors"
                                 (
                                     "id"               integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "first_device_id"  integer,
                                     "second_device_id" integer
                                 )`);
        await queryRunner.query(`INSERT INTO "device_neighbors"("id", "first_device_id", "second_device_id")
                                 SELECT "id", "first_device_id", "second_device_id"
                                 FROM "temporary_device_neighbors"`);
        await queryRunner.query(`DROP TABLE "temporary_device_neighbors"`);
        await queryRunner.query(`ALTER TABLE "interfaces" RENAME TO "temporary_interfaces"`);
        await queryRunner.query(`CREATE TABLE "interfaces"
                                 (
                                     "id"              integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "name"            varchar NOT NULL,
                                     "phy_status"      varchar,
                                     "protocol_status" varchar,
                                     "description"     varchar,
                                     "ip_address"      varchar,
                                     "mtu"             integer,
                                     "snapshot_id"     integer,
                                     "device_id"       integer
                                 )`);
        await queryRunner.query(`INSERT INTO "interfaces"("id", "name", "phy_status", "protocol_status", "description",
                                                          "ip_address", "mtu", "snapshot_id", "device_id")
                                 SELECT "id",
                                        "name",
                                        "phy_status",
                                        "protocol_status",
                                        "description",
                                        "ip_address",
                                        "mtu",
                                        "snapshot_id",
                                        "device_id"
                                 FROM "temporary_interfaces"`);
        await queryRunner.query(`DROP TABLE "temporary_interfaces"`);
        await queryRunner.query(`ALTER TABLE "transceivers" RENAME TO "temporary_transceivers"`);
        await queryRunner.query(`CREATE TABLE "transceivers"
                                 (
                                     "id"             integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "name"           varchar NOT NULL,
                                     "serial_number"  varchar,
                                     "wavelength"     float,
                                     "tx_power"       float,
                                     "rx_power"       float,
                                     "tx_warning_min" float,
                                     "tx_warning_max" float,
                                     "rx_warning_min" float,
                                     "rx_warning_max" float,
                                     "interface_id"   integer,
                                     "snapshot_id"    integer,
                                     "device_id"      integer
                                 )`);
        await queryRunner.query(`INSERT INTO "transceivers"("id", "name", "serial_number", "wavelength", "tx_power",
                                                            "rx_power", "tx_warning_min", "tx_warning_max",
                                                            "rx_warning_min", "rx_warning_max", "interface_id",
                                                            "snapshot_id", "device_id")
                                 SELECT "id",
                                        "name",
                                        "serial_number",
                                        "wavelength",
                                        "tx_power",
                                        "rx_power",
                                        "tx_warning_min",
                                        "tx_warning_max",
                                        "rx_warning_min",
                                        "rx_warning_max",
                                        "interface_id",
                                        "snapshot_id",
                                        "device_id"
                                 FROM "temporary_transceivers"`);
        await queryRunner.query(`DROP TABLE "temporary_transceivers"`);
        await queryRunner.query(`DROP TABLE "snapshots"`);
        await queryRunner.query(`DROP TABLE "devices"`);
        await queryRunner.query(`DROP TABLE "device_neighbors"`);
        await queryRunner.query(`DROP TABLE "interfaces"`);
        await queryRunner.query(`DROP TABLE "transceivers"`);
    }

}
