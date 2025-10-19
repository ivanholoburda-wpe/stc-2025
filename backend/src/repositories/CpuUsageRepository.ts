import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { CpuUsageSummary } from "../models/CpuUsageSummary";
import { TYPES } from "../types";

export interface ICpuUsageRepository {
    upsert(summary: Partial<CpuUsageSummary>): Promise<void>;
}

@injectable()
export class CpuUsageRepository implements ICpuUsageRepository {
    private repository: Repository<CpuUsageSummary>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(CpuUsageSummary);
    }

    async upsert(summary: Partial<CpuUsageSummary>): Promise<void> {
        await this.repository.upsert(
            summary,
            ['device', 'snapshot']
        );
    }
}