import {Interface} from "../models/Interface";
import {injectable, inject} from "inversify";
import {Repository, DataSource, In} from "typeorm";
import {TYPES} from "../types";

export interface IInterfaceRepository {
    findAll(): Promise<Interface[]>;

    findById(id: number): Promise<Interface | null>;

    findAllByDeviceId(deviceId: number, snapshotId: number): Promise<Interface[]>;

    findByNamesAndSnapshot(names: string[], deviceId: number, snapshotId: number): Promise<Interface[]>;

    findByNameAndDevice(name: string, deviceId: number, snapshotId: number): Promise<Interface | null>;

    create(iface: Partial<Interface>): Promise<Interface>;

    update(id: number, iface: Partial<Interface>): Promise<Interface | null>;

    upsert(interfaces: Partial<Interface>[]): Promise<void>;

    delete(id: number): Promise<boolean>;
}

@injectable()
export class InterfaceRepository implements IInterfaceRepository {
    private repository: Repository<Interface>;

    constructor(@inject(TYPES.DataSource) private dataSource: DataSource) {
        this.repository = dataSource.getRepository(Interface);
    }

    async findAll(): Promise<Interface[]> {
        return await this.repository.find({
            relations: ["snapshot", "device", "transceivers"]
        });
    }

    async findById(id: number): Promise<Interface | null> {
        return await this.repository.findOne({
            where: {id},
            relations: ["snapshot", "device", "transceivers"]
        });
    }

    async findAllByDeviceId(deviceId: number, snapshotId: number): Promise<Interface[]> {
        return await this.repository.find({
            where: {
                device: {id: deviceId},
                snapshot: {id: snapshotId}
            },
            relations: ["transceivers"]
        });
    }

    async findByNamesAndSnapshot(names: string[], deviceId: number, snapshotId: number): Promise<Interface[]> {
        if (names.length === 0) {
            return [];
        }

        return await this.repository.find({
            where: {
                name: In(names),
                device: { id: deviceId },
                snapshot: { id: snapshotId }
            }
        });
    }

    async findByNameAndDevice(name: string, deviceId: number, snapshotId: number): Promise<Interface | null> {
        return await this.repository.findOne({
            where: {
                name: name,
                device: {id: deviceId},
                snapshot: {id: snapshotId}
            }
        });
    }

    async create(iface: Partial<Interface>): Promise<Interface> {
        const newInterface = this.repository.create(iface);
        return await this.repository.save(newInterface);
    }

    async update(id: number, iface: Partial<Interface>): Promise<Interface | null> {
        await this.repository.update(id, iface);
        return await this.findById(id);
    }

    async upsert(interfaces: Partial<Interface>[]): Promise<void> {
        await this.repository.upsert(
            interfaces,
            ['name', 'device', 'snapshot']
        );
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
