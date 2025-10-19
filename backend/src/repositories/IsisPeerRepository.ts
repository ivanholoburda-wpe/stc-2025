import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { IsisPeer } from "../models/IsisPeer";
import { TYPES } from "../types";

export interface IIsisPeerRepository {
    upsert(peers: Partial<IsisPeer>[]): Promise<void>;
}

@injectable()
export class IsisPeerRepository implements IIsisPeerRepository {
    private repository: Repository<IsisPeer>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(IsisPeer);
    }

    async upsert(peers: Partial<IsisPeer>[]): Promise<void> {
        if (peers.length === 0) return;
        await this.repository.upsert(
            peers,
            ['interface', 'system_id', 'type', 'device', 'snapshot']
        );
    }
}