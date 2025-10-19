import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IBgpPeerRepository} from "../../../repositories/BgpPeerRepository";

@injectable()
export class BgpEvpnPeerIngestor implements IIngestor {
    readonly blockType = "display_bgp_evpn_peer_block";
    readonly priority = 100;

    constructor(
        @inject(TYPES.BgpPeerRepository) private bgpRepo: IBgpPeerRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const peers = Array.isArray(block?.peers) ? block.peers : [];
        if (peers.length === 0) return;

        const peersToUpsert = peers.map(peer => ({
            device: context.device,
            snapshot: context.snapshot,
            peer_ip: peer.peer,
            address_family: 'evpn',

            remote_as: peer.as,
            state: peer.state,
            up_down_time: peer.up_down_time,
            msg_rcvd: peer.msg_rcvd,
            msg_sent: peer.msg_sent,
        }));

        await this.bgpRepo.upsert(peersToUpsert);
        console.log(`[BgpEvpnPeerIngestor] Upserted ${peersToUpsert.length} EVPN BGP peers.`);
    }
}