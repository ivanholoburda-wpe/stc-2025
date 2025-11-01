import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { Vlan } from "../models/Vlan";
import { TYPES } from "../types";

export interface IVlanRepository {
    upsert(vlans: Partial<Vlan>[]): Promise<void>;
}

@injectable()
export class VlanRepository implements IVlanRepository {
    private repository: Repository<Vlan>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(Vlan);
    }

    async upsert(vlans: Partial<Vlan>[]): Promise<void> {
        if (vlans.length === 0) {
            return;
        }

        await this.repository.upsert(
            vlans,
            ['vid', 'device', 'snapshot']
        );
    }
}

