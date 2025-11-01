import {injectable, inject} from "inversify";
import {Device} from "../../models/Device";
import {IDeviceRepository} from "../../repositories/DeviceRepository";
import {TYPES} from "../../types"
import {ISnapshotRepository} from "../../repositories/SnapshotRepository";

export interface IDeviceService {
    getAllDevices(): Promise<Device[]>;

    getDeviceById(id: number): Promise<Device | null>;

    createDevice(deviceData: Partial<Device>): Promise<Device>;

    updateDevice(id: number, deviceData: Partial<Device>): Promise<Device | null>;

    deleteDevice(id: number): Promise<boolean>;

    getDetailsForSummary(deviceId: number, snapshotId: number): Promise<Device | null>;

    getDetailsWithInterfaces(deviceId: number, snapshotId: number): Promise<Device | null>;

    getDetailsWithRouting(deviceId: number, snapshotId: number): Promise<Device | null>;

    getDetailsWithProtocols(deviceId: number, snapshotId: number): Promise<Device | null>;

    getDetailsWithHardware(deviceId: number, snapshotId: number): Promise<Device | null>;

    getDetailsWithVpn(deviceId: number, snapshotId: number): Promise<Device | null>;

    getDetailsWithVlans(deviceId: number, snapshotId: number): Promise<Device | null>;

    getDetailsWithEthTrunks(deviceId: number, snapshotId: number): Promise<Device | null>;

    getDetailsWithPortVlans(deviceId: number, snapshotId: number): Promise<Device | null>;

    getDetailsWithVxlanTunnels(deviceId: number, snapshotId: number): Promise<Device | null>;
}

@injectable()
export class DeviceService implements IDeviceService {
    constructor(
        @inject(TYPES.DeviceRepository) private deviceRepository: IDeviceRepository,
        @inject(TYPES.SnapshotRepository) private readonly snapshotRepository: ISnapshotRepository,
    ) {
    }

    async getAllDevices(): Promise<Device[]> {
        const latestSnapshot = await this.snapshotRepository.findLatest();

        return await this.deviceRepository.findAll(latestSnapshot.id);
    }

    async getDetailsForSummary(deviceId: number, snapshotId: number): Promise<Device | null> {
        return await this.deviceRepository.findForSummary(deviceId, snapshotId);
    }

    async getDetailsWithInterfaces(deviceId: number, snapshotId: number): Promise<Device | null> {
        return await this.deviceRepository.findWithInterfaces(deviceId, snapshotId);
    }

    async getDetailsWithRouting(deviceId: number, snapshotId: number): Promise<Device | null> {
        return await this.deviceRepository.findWithRouting(deviceId, snapshotId);
    }

    async getDetailsWithProtocols(deviceId: number, snapshotId: number): Promise<Device | null> {
        return await this.deviceRepository.findWithProtocols(deviceId, snapshotId);
    }

    async getDetailsWithHardware(deviceId: number, snapshotId: number): Promise<Device | null> {
        return await this.deviceRepository.findWithHardware(deviceId, snapshotId);
    }

    async getDetailsWithVpn(deviceId: number, snapshotId: number): Promise<Device | null> {
        return await this.deviceRepository.findWithVpn(deviceId, snapshotId);
    }

    async getDetailsWithVlans(deviceId: number, snapshotId: number): Promise<Device | null> {
        return await this.deviceRepository.findWithVlans(deviceId, snapshotId);
    }

    async getDetailsWithEthTrunks(deviceId: number, snapshotId: number): Promise<Device | null> {
        return await this.deviceRepository.findWithEthTrunks(deviceId, snapshotId);
    }

    async getDetailsWithPortVlans(deviceId: number, snapshotId: number): Promise<Device | null> {
        return await this.deviceRepository.findWithPortVlans(deviceId, snapshotId);
    }

    async getDetailsWithVxlanTunnels(deviceId: number, snapshotId: number): Promise<Device | null> {
        return await this.deviceRepository.findWithVxlanTunnels(deviceId, snapshotId);
    }

    async getDeviceById(id: number): Promise<Device | null> {
        return await this.deviceRepository.findById(id);
    }

    async createDevice(deviceData: Partial<Device>): Promise<Device> {
        return await this.deviceRepository.create(deviceData);
    }

    async updateDevice(id: number, deviceData: Partial<Device>): Promise<Device | null> {
        return await this.deviceRepository.update(id, deviceData);
    }

    async deleteDevice(id: number): Promise<boolean> {
        return await this.deviceRepository.delete(id);
    }
}
