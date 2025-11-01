import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { VxlanTunnel } from "../models/VxlanTunnel";
import { TYPES } from "../types";

export interface IVxlanTunnelRepository {
    upsert(tunnels: Partial<VxlanTunnel>[]): Promise<void>;
}

@injectable()
export class VxlanTunnelRepository implements IVxlanTunnelRepository {
    private repository: Repository<VxlanTunnel>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(VxlanTunnel);
    }

    async upsert(tunnels: Partial<VxlanTunnel>[]): Promise<void> {
        if (tunnels.length === 0) {
            return;
        }

        await this.repository.upsert(
            tunnels,
            ['tunnel_id', 'vpn_instance', 'device', 'snapshot']
        );
    }
}

