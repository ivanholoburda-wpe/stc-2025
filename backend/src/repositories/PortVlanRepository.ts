import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { PortVlan } from "../models/PortVlan";
import { TYPES } from "../types";

export interface IPortVlanRepository {
    upsert(portVlans: Partial<PortVlan>[]): Promise<void>;
}

@injectable()
export class PortVlanRepository implements IPortVlanRepository {
    private repository: Repository<PortVlan>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(PortVlan);
    }

    async upsert(portVlans: Partial<PortVlan>[]): Promise<void> {
        if (portVlans.length === 0) {
            return;
        }

        await this.repository.upsert(
            portVlans,
            ['port_name', 'device', 'snapshot']
        );
    }
}

