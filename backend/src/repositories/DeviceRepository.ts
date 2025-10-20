import {injectable, inject} from "inversify";
import {Repository, DataSource, In} from "typeorm";
import {Device} from "../models/Device";
import {TYPES} from "../types";
import {Snapshot} from "../models/Snapshot";
import {SnapshotRepository} from "./SnapshotRepository";

export interface IDeviceRepository {
    findAll(snapshotId: number): Promise<Device[]>;

    findById(id: number): Promise<Device | null>;

    findByHostname(hostname: string): Promise<Device | null>;

    findByHostnames(hostnames: string[]): Promise<Device[]>;

    create(device: Partial<Device>): Promise<Device>;

    update(id: number, device: Partial<Device>): Promise<Device | null>;

    delete(id: number): Promise<boolean>;
}

@injectable()
export class DeviceRepository implements IDeviceRepository {
    private repository: Repository<Device>;

    constructor(
        @inject(TYPES.DataSource) private dataSource: DataSource,
        @inject(TYPES.SnapshotRepository) private snapshotRepository: SnapshotRepository
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
                { snapshotId }
            )
            .getMany();
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
