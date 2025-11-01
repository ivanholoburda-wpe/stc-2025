import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IBgpPeerRepository} from "../../../repositories/BgpPeerRepository";

@injectable()
export class BgpPeerIngestor implements IIngestor {
    readonly blockType = "display_bgp_peer_block";
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
            address_family: 'ipv4_unicast',

            remote_as: peer.as_number || peer.as,
            state: peer.state,
            up_down_time: peer.up_down_time,
            msg_rcvd: peer.msg_received || peer.msg_rcvd || 0,
            msg_sent: peer.msg_sent || 0,
            version: peer.version || null,
            out_queue: peer.out_queue || null,
            prefixes_received: peer.prefixes_received || null,
            vpn_instance: peer.vpn_instance || null,
        }));

        await this.bgpRepo.upsert(peersToUpsert);
        console.log(`[BgpPeerIngestor] Upserted ${peersToUpsert.length} IPv4 Unicast BGP peers.`);
    }
}