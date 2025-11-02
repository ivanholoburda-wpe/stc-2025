import {injectable, inject} from "inversify";
import {DataSource, Not, Repository} from "typeorm";
import {TYPES} from "../types";
import {Interface} from "../models/Interface";
import {Device} from "../models/Device";
import {HardwareComponent} from "../models/HardwareComponent";
import {Transceiver} from "../models/Transceiver";
import {ARPRecord} from "../models/ARPRecord";

export interface NetworkHealthData {
    hostname: string;
    model: string;
    cpu_usage_percent: number | null;
    free_storage_percent: number | null;
    critical_alarms_count: number;
    down_bgp_peers_count: number;
}

export interface IReportRepository {
    getDevicesForSnapshot(snapshotId: number): Promise<Device[]>

    findForSummary(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithInterfaces(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithRouting(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithProtocols(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithHardware(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithVpn(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithAlarms(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithL2(deviceId: number, snapshotId: number): Promise<Device | null>;

    getPerDeviceReportData(snapshotId: number): Promise<Device[]>;

    getInterfaceReportData(snapshotId: number): Promise<Interface[]>;

    getIgpReportData(snapshotId: number): Promise<Device[]>;

    getHardwareInventoryData(snapshotId: number): Promise<HardwareComponent[]>;

    getTransceiverInventoryData(snapshotId: number): Promise<Transceiver[]>;

    getSoftwareLicenseData(snapshotId: number): Promise<Device[]>;

    getNetworkHealthData(snapshotId: number): Promise<NetworkHealthData[]>;

    getDownPortsData(snapshotId: number): Promise<Interface[]>;

    getArpReportData(snapshotId: number): Promise<ARPRecord[]>;

    getIpRoutesPerDevice(snapshotId: number): Promise<Device[]>;
}

@injectable()
export class ReportRepository implements IReportRepository {
    constructor(@inject(TYPES.DataSource) private dataSource: DataSource) {
    }

    private getRepo<T extends { id: number }>(entity: new () => T): Repository<T> {
        return this.dataSource.getRepository(entity as any);
    }

    async getDevicesForSnapshot(snapshotId: number): Promise<Device[]> {
        return this.getRepo(Device).createQueryBuilder("device")
            .where("EXISTS (SELECT 1 FROM interfaces i WHERE i.device_id = device.id AND i.snapshot_id = :snapshotId)", {snapshotId})
            .orderBy("device.hostname", "ASC")
            .getMany();
    }

    async findForSummary(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.getRepo(Device).findOne({
            where: {
                id: deviceId,
                cpuSummaries: {snapshot: {id: snapshotId}},
                storageSummaries: {snapshot: {id: snapshotId}},
                licenseInfos: {snapshot: {id: snapshotId}},
                patchInfos: {snapshot: {id: snapshotId}},
                stpConfigurations: {snapshot: {id: snapshotId}},
            },
            relations: [
                "cpuSummaries",
                "storageSummaries",
                "licenseInfos",
                "patchInfos",
                "stpConfigurations"
            ],
        });
    }

    async findWithInterfaces(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.getRepo(Device).findOne({
            where: {
                id: deviceId,
                interfaces: {snapshot: {id: snapshotId}}
            },
            relations: {
                interfaces: {
                    transceivers: true
                }
            }
        });
    }

    async findWithRouting(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.getRepo(Device).findOne({
            where: {
                id: deviceId,
                ipRoutes: {snapshot: {id: snapshotId}},
                arpRecords: {snapshot: {id: snapshotId}},
            },
            relations: {
                ipRoutes: {interface: true},
                arpRecords: true,
            }
        });
    }

    async findWithProtocols(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.getRepo(Device).findOne({
            where: {
                id: deviceId,
                bgpPeers: {snapshot: {id: snapshotId}},
                ospfInterfaceDetails: {snapshot: {id: snapshotId}},
                isisPeers: {snapshot: {id: snapshotId}},
                bfdSessions: {snapshot: {id: snapshotId}},
            },
            relations: {
                bgpPeers: true,
                ospfInterfaceDetails: {interface: true},
                isisPeers: {interface: true},
                bfdSessions: {interface: true},
            }
        });
    }

    async findWithHardware(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.getRepo(Device).findOne({
            where: {
                id: deviceId,
                hardwareComponents: {snapshot: {id: snapshotId}},
            },
            relations: ["hardwareComponents"]
        });
    }

    async findWithVpn(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.getRepo(Device).findOne({
            where: {
                id: deviceId,
                mplsL2vcs: {snapshot: {id: snapshotId}},
                vpnInstances: {snapshot: {id: snapshotId}},
            },
            relations: {
                mplsL2vcs: {interface: true},
                vpnInstances: true,
            }
        });
    }

    async findWithAlarms(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.getRepo(Device).findOne({
            where: {
                id: deviceId,
                alarms: {snapshot: {id: snapshotId}},
            },
            relations: ["alarms"]
        });
    }

    async findWithL2(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.getRepo(Device).findOne({
            where: {
                id: deviceId,
                ethTrunks: {snapshot: {id: snapshotId}},
                vlans: {snapshot: {id: snapshotId}},
                portVlans: {snapshot: {id: snapshotId}},
                vxlanTunnels: {snapshot: {id: snapshotId}},
                etrunks: {snapshot: {id: snapshotId}},
            },
            relations: [
                "ethTrunks",
                "vlans",
                "portVlans",
                "vxlanTunnels",
                "etrunks",
            ]
        });
    }

    async getIpRoutesPerDevice(snapshotId: number): Promise<Device[]> {
        return this.dataSource.getRepository(Device).createQueryBuilder("device")
            .where("EXISTS (SELECT 1 FROM ip_routes WHERE ip_routes.device_id = device.id AND ip_routes.snapshot_id = :snapshotId)", {snapshotId})
            .leftJoinAndSelect("device.ipRoutes", "ipRoute", "ipRoute.snapshot_id = :snapshotId")
            .leftJoinAndSelect("ipRoute.interface", "ipRouteInterface")
            .setParameters({snapshotId})
            .orderBy("device.hostname", "ASC")
            .getMany();
    }

    async getArpReportData(snapshotId: number): Promise<ARPRecord[]> {
        return this.dataSource.getRepository(ARPRecord).find({
            where: {snapshot: {id: snapshotId}},
            relations: ["device"],
            order: {
                device: {hostname: "ASC"},
                ip_address: "ASC"
            }
        });
    }

    async getDownPortsData(snapshotId: number): Promise<Interface[]> {
        return this.dataSource.getRepository(Interface).find({
            where: {
                snapshot: {id: snapshotId},
                phy_status: Not('up')
            },
            relations: ["device"],
            order: {
                device: {hostname: "ASC"},
                name: "ASC"
            }
        });
    }

    async getNetworkHealthData(snapshotId: number): Promise<NetworkHealthData[]> {
        return this.dataSource.query(`
            SELECT d.hostname,
                   d.model,
                   cpu.system_cpu_use_rate_percent as cpu_usage_percent,
                   CASE
                       WHEN storage.total_mb > 0 THEN (storage.free_mb * 100.0 / storage.total_mb)
                       ELSE NULL
                       END                         as free_storage_percent,
                   (SELECT COUNT(*)
                    FROM alarms a
                    WHERE a.device_id = d.id
                      AND a.snapshot_id = ?
                      AND a.level = 'Critical')    as critical_alarms_count,
                   (SELECT COUNT(*)
                    FROM bgp_peers bp
                    WHERE bp.device_id = d.id
                      AND bp.snapshot_id = ?
                      AND bp.state != 'Established') as down_bgp_peers_count
            FROM
                devices d
                LEFT JOIN cpu_usage_summaries cpu
            ON d.id = cpu.device_id AND cpu.snapshot_id = ?
                LEFT JOIN storage_summaries storage ON d.id = storage.device_id AND storage.snapshot_id = ?
            WHERE EXISTS (SELECT 1 FROM interfaces i WHERE i.device_id = d.id AND i.snapshot_id = ?)
            ORDER BY d.hostname ASC;
        `, [snapshotId, snapshotId, snapshotId, snapshotId, snapshotId]);
    }

    async getSoftwareLicenseData(snapshotId: number): Promise<Device[]> {
        return this.dataSource.getRepository(Device).find({
            where: [
                {licenseInfos: {snapshot: {id: snapshotId}}},
                {patchInfos: {snapshot: {id: snapshotId}}}
            ],
            relations: {
                licenseInfos: true,
                patchInfos: true,
            },
            order: {
                hostname: "ASC"
            }
        });
    }

    async getTransceiverInventoryData(snapshotId: number): Promise<Transceiver[]> {
        return this.dataSource.getRepository(Transceiver).find({
            where: {snapshot: {id: snapshotId}},
            relations: {
                interface: true,
                device: true,
            },
            order: {
                device: {hostname: "ASC"},
                interface: {name: "ASC"}
            }
        });
    }

    async getHardwareInventoryData(snapshotId: number): Promise<HardwareComponent[]> {
        return this.dataSource.getRepository(HardwareComponent).find({
            where: {snapshot: {id: snapshotId}},
            relations: ["device"],
            order: {
                device: {hostname: "ASC"},
                slot: "ASC"
            }
        });
    }

    async getPerDeviceReportData(snapshotId: number): Promise<Device[]> {
        return this.dataSource.getRepository(Device).createQueryBuilder("device")
            .where("EXISTS (SELECT 1 FROM interfaces WHERE interfaces.device_id = device.id AND interfaces.snapshot_id = :snapshotId)", {snapshotId})
            .leftJoinAndSelect(
                "device.interfaces",
                "interface",
                "interface.snapshot_id = :snapshotId",
                {snapshotId}
            )
            .orderBy("device.hostname", "ASC")
            .getMany();
    }

    async getInterfaceReportData(snapshotId: number): Promise<Interface[]> {
        return this.dataSource.getRepository(Interface).find({
            where: {snapshot: {id: snapshotId}},
            relations: [
                "device",
                "transceivers"
            ],
            order: {
                device: {hostname: "ASC"},
                name: "ASC"
            }
        });
    }

    async getIgpReportData(snapshotId: number): Promise<Device[]> {
        return this.dataSource.getRepository(Device).find({
            where: {
                interfaces: {
                    snapshot: {id: snapshotId}
                }
            },
            relations: [
                "interfaces",
                "ospfInterfaceDetails",
                "ospfInterfaceDetails.interface",
                "isisPeers",
                "isisPeers.interface",
            ],
        });
    }
}

