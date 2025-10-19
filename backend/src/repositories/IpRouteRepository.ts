import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { IpRoute } from "../models/IpRoute";
import { TYPES } from "../types";

export interface IIpRouteRepository {
    upsert(routes: Partial<IpRoute>[]): Promise<void>;
}

@injectable()
export class IpRouteRepository implements IIpRouteRepository {
    private repository: Repository<IpRoute>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(IpRoute);
    }

    async upsert(routes: Partial<IpRoute>[]): Promise<void> {
        if (routes.length === 0) return;
        await this.repository.upsert(
            routes,
            ['destination_mask', 'next_hop', 'interface', 'device', 'snapshot']
        );
    }
}