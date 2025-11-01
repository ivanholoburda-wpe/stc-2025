import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { ETrunk } from "../models/ETrunk";
import { TYPES } from "../types";

export interface IETrunkRepository {
    upsert(etrunks: Partial<ETrunk>[]): Promise<void>;
}

@injectable()
export class ETrunkRepository implements IETrunkRepository {
    private repository: Repository<ETrunk>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(ETrunk);
    }

    async upsert(etrunks: Partial<ETrunk>[]): Promise<void> {
        if (etrunks.length === 0) {
            return;
        }

        await this.repository.upsert(
            etrunks,
            ['etrunk_id', 'device', 'snapshot']
        );
    }
}

