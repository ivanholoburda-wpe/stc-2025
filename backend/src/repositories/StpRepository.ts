import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { StpConfiguration } from "../models/StpConfiguration";
import { TYPES } from "../types";

export interface IStpRepository {
    upsert(config: Partial<StpConfiguration>): Promise<void>;
}

@injectable()
export class StpRepository implements IStpRepository {
    private repository: Repository<StpConfiguration>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(StpConfiguration);
    }

    async upsert(config: Partial<StpConfiguration>): Promise<void> {
        await this.repository.upsert(
            config,
            ['device', 'snapshot']
        );
    }
}