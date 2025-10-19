import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { PatchInfo } from "../models/PatchInfo";
import { TYPES } from "../types";

export interface IPatchInfoRepository {
    upsert(patchInfo: Partial<PatchInfo>): Promise<void>;
}

@injectable()
export class PatchInfoRepository implements IPatchInfoRepository {
    private repository: Repository<PatchInfo>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(PatchInfo);
    }

    async upsert(patchInfo: Partial<PatchInfo>): Promise<void> {
        await this.repository.upsert(
            patchInfo,
            ['device', 'snapshot']
        );
    }
}