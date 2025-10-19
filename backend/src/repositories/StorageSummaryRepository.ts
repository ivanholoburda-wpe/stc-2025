import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { StorageSummary } from "../models/StorageSummary";
import { TYPES } from "../types";

export interface IStorageSummaryRepository {
    upsert(summary: Partial<StorageSummary>): Promise<void>;
}

@injectable()
export class StorageSummaryRepository implements IStorageSummaryRepository {
    private repository: Repository<StorageSummary>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(StorageSummary);
    }

    async upsert(summary: Partial<StorageSummary>): Promise<void> {
        await this.repository.upsert(
            summary,
            ['device', 'snapshot']
        );
    }
}