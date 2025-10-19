import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { MplsL2vc } from "../models/MplsL2vc";
import { TYPES } from "../types";

export interface IMplsL2vcRepository {
    upsert(vc: Partial<MplsL2vc>): Promise<void>;
}

@injectable()
export class MplsL2vcRepository implements IMplsL2vcRepository {
    private repository: Repository<MplsL2vc>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(MplsL2vc);
    }

    async upsert(vc: Partial<MplsL2vc>): Promise<void> {
        await this.repository.upsert(
            vc,
            ['interface', 'vc_id', 'destination', 'device', 'snapshot']
        );
    }
}