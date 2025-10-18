import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { ARPRecord } from "../models/ARPRecord";
import { TYPES } from "../types";

export interface IARPRecordRepository {
    upsert(records: Partial<ARPRecord>[]): Promise<void>;
}

@injectable()
export class ARPRecordRepository implements IARPRecordRepository {
    private repository: Repository<ARPRecord>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(ARPRecord);
    }

    async upsert(records: Partial<ARPRecord>[]): Promise<void> {
        if (records.length === 0) return;

        await this.repository.upsert(
            records,
            ["ip_address", "device", "snapshot"]
        );
    }
}