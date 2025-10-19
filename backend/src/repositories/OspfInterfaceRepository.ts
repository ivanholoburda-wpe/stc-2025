import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { OspfInterfaceDetail } from "../models/OspfInterfaceDetail";
import { TYPES } from "../types";

export interface IOspfInterfaceRepository {
    upsert(ospfInterface: Partial<OspfInterfaceDetail>): Promise<void>;
}

@injectable()
export class OspfInterfaceRepository implements IOspfInterfaceRepository {
    private repository: Repository<OspfInterfaceDetail>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(OspfInterfaceDetail);
    }

    async upsert(ospfInterface: Partial<OspfInterfaceDetail>): Promise<void> {
        await this.repository.upsert(
            ospfInterface,
            ['interface', 'device', 'snapshot']
        );
    }
}