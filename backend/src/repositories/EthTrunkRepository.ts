import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { EthTrunk } from "../models/EthTrunk";
import { TYPES } from "../types";

export interface IEthTrunkRepository {
    upsert(trunks: Partial<EthTrunk>[]): Promise<void>;
}

@injectable()
export class EthTrunkRepository implements IEthTrunkRepository {
    private repository: Repository<EthTrunk>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(EthTrunk);
    }

    async upsert(trunks: Partial<EthTrunk>[]): Promise<void> {
        if (trunks.length === 0) {
            return;
        }

        await this.repository.upsert(
            trunks,
            ['trunk_id', 'device', 'snapshot']
        );
    }
}

