import {Snapshot} from "../models/Snapshot";
import {injectable, inject} from "inversify";
import {Repository, DataSource} from "typeorm";
import {TYPES} from "../types";

export interface ISnapshotRepository {
    findAll(): Promise<Snapshot[]>;

    findById(id: number): Promise<Snapshot | null>;

    findLatest(): Promise<Snapshot | null>;

    create(snapshot: Partial<Snapshot>): Promise<Snapshot>;

    update(id: number, snapshot: Partial<Snapshot>): Promise<Snapshot | null>;

    delete(id: number): Promise<boolean>;

    getSnapshotWithAllData(id: number): Promise<Snapshot | null>
}

@injectable()
export class SnapshotRepository implements ISnapshotRepository {
    private repository: Repository<Snapshot>;

    constructor(@inject(TYPES.DataSource) private dataSource: DataSource) {
        this.repository = dataSource.getRepository(Snapshot);
    }

    async findAll(): Promise<Snapshot[]> {
        return await this.repository.find();
    }

    async findById(id: number): Promise<Snapshot | null> {
        return await this.repository.findOne({
            where: {id},
            relations: ["devices", "interfaces", "transceivers"]
        });
    }

    async findLatest(): Promise<Snapshot | null> {
        return await this.repository.findOne({
            order: {
                created_at: 'DESC'
            },
            relations: {
                devices: {
                    interfaces: {
                        transceivers: true,
                    },
                },
            }
        });
    }

    async create(snapshot: Partial<Snapshot>): Promise<Snapshot> {
        const newSnapshot = this.repository.create(snapshot);
        return await this.repository.save(newSnapshot);
    }

    async update(id: number, snapshot: Partial<Snapshot>): Promise<Snapshot | null> {
        await this.repository.update(id, snapshot);
        return await this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }

    async getSnapshotWithAllData(id: number): Promise<Snapshot | null> {
        return await this.repository.findOne({
            where: {id},
            relations: {
                devices: {
                    interfaces: {
                        transceivers: true,
                    },
                },
            }
        });
    }
}
