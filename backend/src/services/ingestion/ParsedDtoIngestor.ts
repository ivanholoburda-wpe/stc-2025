import {In, Repository} from "typeorm";
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
    /**
     * Repositories
     */
    private ifaceRepo: Repository<Interface>;
    private trxRepo: Repository<Transceiver>;
    private devRepo: Repository<Device>;
    private neighRepo: Repository<DeviceNeighbor>;
    private alarmRepo: Repository<Alarm>;
    private arpRepo: Repository<ARPRecord>;

    /**
     * Cache to make relations
     */
    private interfaceCache: Map<string, Interface>;

    constructor(private readonly dataSource: TypeOrmDataSource = AppDataSource) {
        this.ifaceRepo = this.dataSource.getRepository(Interface);
        this.trxRepo = this.dataSource.getRepository(Transceiver);
        this.devRepo = this.dataSource.getRepository(Device);
        this.neighRepo = this.dataSource.getRepository(DeviceNeighbor);
        this.alarmRepo = this.dataSource.getRepository(Alarm);
        this.arpRepo = this.dataSource.getRepository(ARPRecord);
    }

    async ingest(results: ParserResults, snapshot: Snapshot, device: Device): Promise<void> {
        this.initCaches();

        if (!results?.data || !Array.isArray(results.data)) {
            return;
        }

        const processingOrder = [
            "display_version",
            "display_interface_brief_block",
            "display_optical_module_brief_block",
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
                    case "display_optical_module_brief_block":
                        await this.ingestTransceiverBrief(block, snapshot, device);
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

        const interfaceNames = rows.map(row => String(row.interface));

        const upsertedInterfaces = await this.ifaceRepo.find({
            where: {
                name: In(interfaceNames),
                device: { id: device.id },
                snapshot: { id: snapshot.id }
            }
        });

        for (const iface of upsertedInterfaces) {
            this.interfaceCache.set(iface.name, iface);
        }
    }

    private async ingestTransceiverBrief(block: ParserBlock, snapshot: Snapshot, device: Device): Promise<void> {
        const rows = Array.isArray(block?.modules) ? block.modules : [];

        if (rows.length === 0) {
            return;
        }

        const transceiversToUpsert = rows.map(row => {
            const interfaceName = this.normalizeInterfaceName(row.port, row.type);

            const parentInterface = this.interfaceCache.get(interfaceName);

            if (!parentInterface) {
                console.warn(`[ingestTransceiverBrief] Interface '${interfaceName}' not found in cache. Skipping transceiver.`);
                return null;
            }

            const wavelengthValue = row.wavelength ? parseFloat(row.wavelength) : undefined;

            const transceiverData: Partial<Transceiver> = {
                interface: parentInterface,
                snapshot: snapshot,
                device: device,
                name: `${parentInterface.name} transceiver`,
                status: row.status,
                duplex: row.duplex,
                type: row.type,
                mode: row.mode,
                vendor_pn: row.vendor_pn,
                lanes: row.lanes,
                wavelength: !isNaN(wavelengthValue) ? wavelengthValue : undefined,
                rx_power: typeof row.rx_power_dbm === 'number' ? row.rx_power_dbm : undefined,
                tx_power: typeof row.tx_power_dbm === 'number' ? row.tx_power_dbm : undefined,
            };

            return transceiverData;
        }).filter((t): t is Partial<Transceiver> => t !== null);

        if (transceiversToUpsert.length === 0) {
            return;
        }

        await this.trxRepo.upsert(
            transceiversToUpsert,
            ['interface', 'device', 'snapshot']
        );
    }

    private async ingestTransceiverVerbose(block: ParserBlock, snapshot: Snapshot, device: Device): Promise<void> {
        const ifaceName: string | undefined = block?.interface;
        if (!ifaceName) {
            return;
        }

        let iface = this.interfaceCache.get(ifaceName);

        if (!iface) {
            console.warn(`[ingestTransceiverVerbose] Interface '${ifaceName}' not in cache. Creating on-the-fly.`);
            iface = this.ifaceRepo.create({ name: ifaceName, device, snapshot });
            await this.ifaceRepo.save(iface);
            this.interfaceCache.set(ifaceName, iface);
        }

        const transceiverData: Partial<Transceiver> = {
            interface: iface,
            device: device,
            snapshot: snapshot,

            name: `${iface.name} transceiver`,
            serial_number: block?.manufacture_information?.manu_serial_number,
            wavelength: block?.common_information?.wavelength,
            tx_power: block?.diagnostic_information?.tx_power,
            rx_power: block?.diagnostic_information?.rx_power,
            tx_warning_min: block?.diagnostic_information?.tx_power_low_threshold,
            tx_warning_max: block?.diagnostic_information?.tx_power_high_threshold,
            rx_warning_min: block?.diagnostic_information?.rx_power_low_threshold,
            rx_warning_max: block?.diagnostic_information?.rx_power_high_threshold,
        };

        await this.trxRepo.upsert(
            [transceiverData],
            ['interface', 'device', 'snapshot']
        );
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

    private normalizeInterfaceName(shortName: string, moduleType: string): string | null {
        const numericPartMatch = shortName.match(/(\d+(\/\d+)*)/);
        if (!numericPartMatch) {
            return null;
        }

        const numericPart = numericPartMatch[0];

        let prefix: string | null = null;

        const lowerModuleType = moduleType.toLowerCase();

        if (lowerModuleType.includes('100g')) {
            prefix = '100GE';
        } else if (lowerModuleType.includes('40g')) {
            prefix = '40GE';
        } else if (lowerModuleType.includes('25g')) {
            prefix = '25GE';
        } else if (lowerModuleType.includes('10g')) {
            prefix = 'GigabitEthernet';
        } else if (lowerModuleType.includes('1g') || lowerModuleType.includes('esfp')) {
            prefix = 'GigabitEthernet';
        } else if (lowerModuleType.includes('fe') || lowerModuleType.includes('100m')) {
            prefix = 'FastEthernet';
        } else {
            return null;
        }

        return `${prefix}${numericPart}`;
    }

    private initCaches(): void {
        this.interfaceCache = new Map<string, Interface>();
    }
}
export default ParsedDtoIngestor;


