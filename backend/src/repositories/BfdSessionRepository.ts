import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { BfdSession } from "../models/BfdSession";
import { TYPES } from "../types";

export interface IBfdRepository {
    upsert(sessions: Partial<BfdSession>[]): Promise<void>;
}

@injectable()
export class BfdRepository implements IBfdRepository {
    private repository: Repository<BfdSession>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(BfdSession);
    }

    async upsert(sessions: Partial<BfdSession>[]): Promise<void> {
        if (sessions.length === 0) {
            return;
        }

        await this.repository.upsert(
            sessions,
            ['interface', 'device', 'snapshot']
        );
    }
}