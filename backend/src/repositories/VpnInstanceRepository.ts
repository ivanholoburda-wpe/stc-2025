import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { VpnInstance } from "../models/VpnInstance";
import { TYPES } from "../types";

export interface IVpnInstanceRepository {
    upsert(instances: Partial<VpnInstance>[]): Promise<void>;
}

@injectable()
export class VpnInstanceRepository implements IVpnInstanceRepository {
    private repository: Repository<VpnInstance>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(VpnInstance);
    }

    async upsert(instances: Partial<VpnInstance>[]): Promise<void> {
        if (instances.length === 0) return;

        await this.repository.upsert(
            instances,
            ['name', 'address_family', 'device', 'snapshot']
        );
    }
}