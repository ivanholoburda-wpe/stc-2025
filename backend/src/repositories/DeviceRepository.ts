import {injectable, inject} from "inversify";
import {Repository, DataSource, In} from "typeorm";
import {Device} from "../models/Device";
import {TYPES} from "../types";

export interface IDeviceRepository {
    findAll(snapshotId: number): Promise<Device[]>;

    findById(id: number): Promise<Device | null>;

    findByHostname(hostname: string): Promise<Device | null>;

    findByHostnames(hostnames: string[]): Promise<Device[]>;

    create(device: Partial<Device>): Promise<Device>;

    update(id: number, device: Partial<Device>): Promise<Device | null>;

    delete(id: number): Promise<boolean>;

    findForSummary(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithInterfaces(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithRouting(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithProtocols(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithHardware(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithVpn(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithVlans(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithEthTrunks(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithPortVlans(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithVxlanTunnels(deviceId: number, snapshotId: number): Promise<Device | null>;

    findWithETrunks(deviceId: number, snapshotId: number): Promise<Device | null>;

    findByFolderName(folderName: string): Promise<Device | null>;
}

@injectable()
export class DeviceRepository implements IDeviceRepository {
    private repository: Repository<Device>;

    constructor(
        @inject(TYPES.DataSource) private dataSource: DataSource,
    ) {
        this.repository = dataSource.getRepository(Device);
    }

    async findAll(snapshotId: number): Promise<Device[]> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.firstSeenSnapshot", "firstSeenSnapshot")
            .leftJoinAndSelect(
                "device.interfaces",
                "interface",
                "interface.snapshot_id = :snapshotId",
                {snapshotId}
            )
            .getMany();
    }

    async findForSummary(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.cpuSummaries", "cpuSummary", "cpuSummary.snapshot_id = :snapshotId")
            .leftJoinAndSelect("device.storageSummaries", "storageSummary", "storageSummary.snapshot_id = :snapshotId")
            .leftJoinAndSelect("device.licenseInfos", "licenseInfo", "licenseInfo.snapshot_id = :snapshotId")
            .leftJoinAndSelect("device.patchInfos", "patchInfo", "patchInfo.snapshot_id = :snapshotId")
            .leftJoinAndSelect("device.stpConfigurations", "stpConfig", "stpConfig.snapshot_id = :snapshotId")
            .where("device.id = :deviceId")
            .setParameters({deviceId, snapshotId})
            .getOne();
    }

    async findWithInterfaces(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.interfaces", "interface", "interface.snapshot_id = :snapshotId")
            .leftJoinAndSelect("interface.transceivers", "transceiver")
            .where("device.id = :deviceId")
            .setParameters({deviceId, snapshotId})
            .getOne();
    }

    async findWithRouting(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.ipRoutes", "ipRoute", "ipRoute.snapshot_id = :snapshotId")
            .leftJoinAndSelect("ipRoute.interface", "ipRouteInterface") // Пов'язаний інтерфейс для маршруту
            .leftJoinAndSelect("device.arpRecords", "arpRecord", "arpRecord.snapshot_id = :snapshotId")
            .where("device.id = :deviceId")
            .setParameters({deviceId, snapshotId})
            .getOne();
    }

    async findWithProtocols(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.bgpPeers", "bgpPeer", "bgpPeer.snapshot_id = :snapshotId")
            .leftJoinAndSelect("device.ospfInterfaceDetails", "ospfDetail", "ospfDetail.snapshot_id = :snapshotId")
            .leftJoinAndSelect("ospfDetail.interface", "ospfInterface")
            .leftJoinAndSelect("device.isisPeers", "isisPeer", "isisPeer.snapshot_id = :snapshotId")
            .leftJoinAndSelect("isisPeer.interface", "isisInterface")
            .leftJoinAndSelect("device.bfdSessions", "bfdSession", "bfdSession.snapshot_id = :snapshotId")
            .leftJoinAndSelect("bfdSession.interface", "bfdInterface")
            .where("device.id = :deviceId")
            .setParameters({deviceId, snapshotId})
            .getOne();
    }

    async findWithHardware(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.hardwareComponents", "hardwareComponent", "hardwareComponent.snapshot_id = :snapshotId")
            .where("device.id = :deviceId")
            .setParameters({deviceId, snapshotId})
            .getOne();
    }

    async findWithVpn(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.mplsL2vcs", "mplsL2vc", "mplsL2vc.snapshot_id = :snapshotId")
            .leftJoinAndSelect("mplsL2vc.interface", "mplsInterface")
            .leftJoinAndSelect("device.vpnInstances", "vpnInstance", "vpnInstance.snapshot_id = :snapshotId")
            .leftJoinAndSelect("device.vxlanTunnels", "vxlanTunnel", "vxlanTunnel.snapshot_id = :snapshotId")
            .where("device.id = :deviceId")
            .setParameters({deviceId, snapshotId})
            .getOne();
    }

    async findWithVlans(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.vlans", "vlan", "vlan.snapshot_id = :snapshotId")
            .where("device.id = :deviceId")
            .setParameters({deviceId, snapshotId})
            .getOne();
    }

    async findWithEthTrunks(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.ethTrunks", "ethTrunk", "ethTrunk.snapshot_id = :snapshotId")
            .where("device.id = :deviceId")
            .setParameters({deviceId, snapshotId})
            .getOne();
    }

    async findWithPortVlans(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.portVlans", "portVlan", "portVlan.snapshot_id = :snapshotId")
            .leftJoinAndSelect("portVlan.interface", "portVlanInterface")
            .where("device.id = :deviceId")
            .setParameters({deviceId, snapshotId})
            .getOne();
    }

    async findWithVxlanTunnels(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.vxlanTunnels", "vxlanTunnel", "vxlanTunnel.snapshot_id = :snapshotId")
            .where("device.id = :deviceId")
            .setParameters({deviceId, snapshotId})
            .getOne();
    }

    async findWithETrunks(deviceId: number, snapshotId: number): Promise<Device | null> {
        return this.repository.createQueryBuilder("device")
            .leftJoinAndSelect("device.etrunks", "etrunk", "etrunk.snapshot_id = :snapshotId")
            .where("device.id = :deviceId")
            .setParameters({deviceId, snapshotId})
            .getOne();
    }

    async findById(id: number): Promise<Device | null> {
        return await this.repository.findOne({
            where: {id},
            relations: ["firstSeenSnapshot", "interfaces", "transceivers"]
        });
    }

    async findByHostname(hostname: string): Promise<Device | null> {
        return await this.repository.findOne({
            where: {hostname},
            relations: ["firstSeenSnapshot", "interfaces", "transceivers"]
        });
    }

    async findByHostnames(hostnames: string[]): Promise<Device[]> {
        if (hostnames.length === 0) {
            return [];
        }

        return await this.repository.find({
            where: {
                hostname: In(hostnames)
            }
        });
    }

    async findByFolderName(folderName: string): Promise<Device | null> {
        return await this.repository.findOne({
            where: { folder_name: folderName },
            relations: ["firstSeenSnapshot"]
        });
    }

    async create(device: Partial<Device>): Promise<Device> {
        const newDevice = this.repository.create(device);
        return await this.repository.save(newDevice);
    }

    async update(id: number, device: Partial<Device>): Promise<Device | null> {
        await this.repository.update(id, device);
        return await this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
