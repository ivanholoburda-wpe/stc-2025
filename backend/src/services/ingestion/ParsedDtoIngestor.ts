import type { Repository } from "typeorm";
import { Snapshot } from "../../models/Snapshot";
import { Device } from "../../models/Device";
import { Interface } from "../../models/Interface";
import { Transceiver } from "../../models/Transceiver";
import { DeviceNeighbor } from "../../models/DeviceNeighbor";
import { AppDataSource } from "../../database/data-source";
import { Alarm } from "../../models/Alarm";
import type { DataSource as TypeOrmDataSource } from "typeorm";
import { ARPRecord } from "../../models/ARPRecord";



type ParserBlock = {
  type?: string;
  [k: string]: any;
};

type ParserResults = {
  success: boolean;
  data: Array<ParserBlock>;
  [k: string]: any;
};

export class ParsedDtoIngestor {
    private ifaceRepo: Repository<Interface>;
    private trxRepo: Repository<Transceiver>;
    private devRepo: Repository<Device>;
    private neighRepo: Repository<DeviceNeighbor>;
    private alarmRepo: Repository<Alarm>;
    private arpRepo: Repository<ARPRecord>;

    constructor(private readonly dataSource: TypeOrmDataSource = AppDataSource) {
        this.ifaceRepo = this.dataSource.getRepository(Interface);
        this.trxRepo = this.dataSource.getRepository(Transceiver);
        this.devRepo = this.dataSource.getRepository(Device);
        this.neighRepo = this.dataSource.getRepository(DeviceNeighbor);
        this.alarmRepo = this.dataSource.getRepository(Alarm);
        this.arpRepo = this.dataSource.getRepository(ARPRecord);
    }

    async ingest(results: ParserResults, snapshot: Snapshot, device: Device): Promise<void> {
        console.log(results);
        if (!results?.data || !Array.isArray(results.data)) return;

        const processingOrder = [
            "display_version",
            "display_interface_brief_block",
            "display_ip_interface_brief_block",
            "display_transceiver_verbose_block",
            "display_lldp_neighbor_brief_block",
            "display_alarm_all_block",
            "display_arp_all_block",
        ];

        for (const type of processingOrder) {
            for (const block of results.data) {
                if (block?.type !== type) continue;
                switch (type) {
                    case "display_version":
                        await this.ingestDeviceVersion(block, device);
                        break;
                    case "display_interface_brief_block":
                        await this.ingestInterfacesBrief(block, snapshot, device);
                        break;
                    case "display_ip_interface_brief_block":
                        await this.ingestIpInterfacesBrief(block, snapshot, device);
                        break;
                    case "display_transceiver_verbose_block":
                        await this.ingestTransceiverVerbose(block, snapshot, device);
                        break;
                    case "display_lldp_neighbor_brief_block":
                        await this.ingestNeighbors(block, device);
                        break;
                    case "display_alarm_all_block":
                        await this.ingestAlarms(block, snapshot, device);
                        break;
                    case "display_arp_all_block":
                        await this.ingestARPRecords(block, snapshot, device);
                        break;

                }
            }
        }
    }

    private async ingestDeviceVersion(block: ParserBlock, device: Device): Promise<void> {
        const maybeModel = block?.vrp?.platform || block?.model;
        if (maybeModel) {
            device.model = String(maybeModel);
            await this.devRepo.save(device);
        }
        const sysname = block?.sysname || block?.hostname;
        if (sysname) {
            device.hostname = String(sysname);
            await this.devRepo.save(device);
        }
    }

    private async ingestInterfacesBrief(block: ParserBlock, snapshot: Snapshot, device: Device): Promise<void> {
        const rows = Array.isArray(block?.interfaces) ? block.interfaces : [];

        if (rows.length === 0) {
            return;
        }

        const interfacesToUpsert = rows.map(row => {
            const ifaceData: Partial<Interface> = {
                name: String(row.interface),
                snapshot: snapshot,
                device: device,
            };

            if (row.phy_status) {
                ifaceData.phy_status = String(row.phy_status);
            }
            if (row.protocol_status) {
                ifaceData.protocol_status = String(row.protocol_status);
            }

            return ifaceData;
        });

        await this.ifaceRepo.upsert(
            interfacesToUpsert,
            ['name', 'device', 'snapshot']
        );
    }

    private async ingestTransceiverVerbose(block: ParserBlock, snapshot: Snapshot, device: Device): Promise<void> {
        const ifaceName: string | undefined = block?.interface;
        if (!ifaceName) return;

        let iface = await this.ifaceRepo.findOne({
            where: {name: ifaceName, device: {id: device.id}, snapshot: {id: snapshot.id}},
            relations: ["device", "snapshot"],
        });

        if (!iface) {
            iface = this.ifaceRepo.create({name: ifaceName, device, snapshot});
            await this.ifaceRepo.save(iface);
        }

        let tx = await this.trxRepo.findOne({
            where: {interface: {id: iface.id}, device: {id: device.id}, snapshot: {id: snapshot.id}},
            relations: ["interface", "device", "snapshot"],
        });
        if (!tx) {
            tx = this.trxRepo.create({
                name: `${ifaceName} transceiver`,
                interface: iface,
                device,
                snapshot,
                serial_number: block?.manufacture_information?.manu_serial_number,
                wavelength: block?.common_information?.wavelength,
                tx_power: block?.diagnostic_information?.tx_power,
                rx_power: block?.diagnostic_information?.rx_power,
                tx_warning_min: block?.diagnostic_information?.tx_power_low_threshold,
                tx_warning_max: block?.diagnostic_information?.tx_power_high_threshold,
                rx_warning_min: block?.diagnostic_information?.rx_power_low_threshold,
                rx_warning_max: block?.diagnostic_information?.rx_power_high_threshold,
            });
        }

        const diag = block?.diagnostic_information || {};
        const common = block?.common_information || {};
        if (typeof common.wavelength === "number") tx.wavelength = common.wavelength;
        if (typeof diag["tx_power"] === "number") tx.tx_power = diag["tx_power"];
        if (typeof diag["rx_power"] === "number") tx.rx_power = diag["rx_power"];

        await this.trxRepo.save(tx);
    }

    private async ingestNeighbors(block: ParserBlock, device: Device): Promise<void> {
        return;
    }

    private async ingestAlarms(block: ParserBlock, snapshot: Snapshot, device: Device): Promise<void> {
        const rows = Array.isArray(block?.alarms) ? block.alarms : [];
        for (const row of rows) {
            const alarm = new Alarm();
            alarm.index = row.index;
            alarm.level = row.level;
            alarm.date = row.date;
            alarm.time = row.time;
            alarm.info = row.info;
            alarm.oid = row.oid;
            alarm.ent_code = row.ent_code;
            alarm.device = device;
            alarm.snapshot = snapshot;
            await this.alarmRepo.save(alarm);
        }
    }

    private async ingestARPRecords(block: ParserBlock, snapshot: Snapshot, device: Device): Promise<void> {
        const rows = Array.isArray(block?.entries) ? block.entries : [];

        if (rows.length === 0) {
            return;
        }

        const arpRecorsToUpsert = rows.map(row => {
            const arpRecordData: Partial<ARPRecord> = {
                ip_address: row.ip_address,
                mac_address: row.mac_address,
                expire_m: row.expire_m,
                type: row.type,
                interface: row.interface,
                vpn_instance: row.vpn_instance,
                vlan: row.vlan,
                cevlan: row.cevlan,
                device: device,
                snapshot: snapshot,
            };

            return arpRecordData;
        });

        await this.arpRepo.upsert(
            arpRecorsToUpsert,
            ["ip_address", "device", "snapshot"]
        )
    }

    private async ingestIpInterfacesBrief(block: ParserBlock, snapshot: Snapshot, device: Device): Promise<void> {
        const rows = Array.isArray(block?.interfaces) ? block.interfaces : [];

        if (rows.length === 0) {
            return;
        }

        const interfacesToUpsert = rows.map(row => {
            const ifaceData: Partial<Interface> = {
                name: String(row.interface),
                ip_address: String(row.ip_address_mask),
                snapshot: snapshot,
                device: device,
            };

            return ifaceData;
        });

        await this.ifaceRepo.upsert(
            interfacesToUpsert,
            ['name', 'device', 'snapshot']
        );
    }
}
export default ParsedDtoIngestor;


