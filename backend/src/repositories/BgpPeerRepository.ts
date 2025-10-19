import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { BgpPeer } from "../models/BgpPeer";
import { TYPES } from "../types";

export interface IBgpPeerRepository {
    upsert(peers: Partial<BgpPeer>[]): Promise<void>;
}

@injectable()
export class BgpPeerRepository implements IBgpPeerRepository {
    private repository: Repository<BgpPeer>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(BgpPeer);
    }

    async upsert(peers: Partial<BgpPeer>[]): Promise<void> {
        if (peers.length === 0) {
            return;
        }

        await this.repository.upsert(
            peers,
            ['peer_ip', 'address_family', 'device', 'snapshot']
        );
    }
}