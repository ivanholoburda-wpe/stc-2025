import {Transceiver} from "../models/Transceiver";
import {injectable, inject} from "inversify";
import {Repository, DataSource} from "typeorm";
import {TYPES} from "../types";
import {Interface} from "../models/Interface";

export interface ITransceiverRepository {
    findAll(): Promise<Transceiver[]>;

    findById(id: number): Promise<Transceiver | null>;

    findAllByDeviceId(deviceId: number, snapshotId: number): Promise<Transceiver[]>;

    findByInterfaceId(interfaceId: number, snapshotId: number): Promise<Transceiver | null>;

    create(transceiver: Partial<Transceiver>): Promise<Transceiver>;

    update(id: number, transceiver: Partial<Transceiver>): Promise<Transceiver | null>;

    upsert(transceivers: Partial<Transceiver>[]): Promise<void>;

    delete(id: number): Promise<boolean>;
}


@injectable()
export class TransceiverRepository implements ITransceiverRepository {
    private repository: Repository<Transceiver>;

    constructor(@inject(TYPES.DataSource) private dataSource: DataSource) {
        this.repository = dataSource.getRepository(Transceiver);
    }

    async findAll(): Promise<Transceiver[]> {
        return await this.repository.find({
            relations: ["interface", "snapshot", "device"]
        });
    }

    async findById(id: number): Promise<Transceiver | null> {
        return await this.repository.findOne({
            where: {id},
            relations: ["interface", "snapshot", "device"]
        });
    }

    async findAllByDeviceId(deviceId: number, snapshotId: number): Promise<Transceiver[]> {
        return await this.repository.find({
            where: {
                device: {id: deviceId},
                snapshot: {id: snapshotId}
            },
            relations: ["interface"]
        });
    }

    async findByInterfaceId(interfaceId: number, snapshotId: number): Promise<Transceiver | null> {
        return await this.repository.findOne({
            where: {
                interface: {id: interfaceId},
                snapshot: {id: snapshotId}
            },
            relations: ["device"]
        });
    }

    async create(transceiver: Partial<Transceiver>): Promise<Transceiver> {
        const newTransceiver = this.repository.create(transceiver);
        return await this.repository.save(newTransceiver);
    }

    async update(id: number, transceiver: Partial<Transceiver>): Promise<Transceiver | null> {
        await this.repository.update(id, transceiver);
        return await this.findById(id);
    }

    async upsert(transceivers: Partial<Transceiver>[]): Promise<void> {
        await this.repository.upsert(
            transceivers,
            ['interface', 'device', 'snapshot']
        );
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}
