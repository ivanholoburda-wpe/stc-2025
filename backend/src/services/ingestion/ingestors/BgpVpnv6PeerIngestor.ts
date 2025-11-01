import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IBgpPeerRepository} from "../../../repositories/BgpPeerRepository";

@injectable()
export class BgpVpnv6PeerIngestor implements IIngestor {
    readonly blockType = "display_bgp_vpnv6_peer_block";
    readonly priority = 100;

    constructor(
        @inject(TYPES.BgpPeerRepository) private bgpRepo: IBgpPeerRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const vpnInstances = Array.isArray(block?.vpn_instances) ? block.vpn_instances : [];
        if (vpnInstances.length === 0) return;

        const peersToUpsert: any[] = [];

        for (const vpnInstance of vpnInstances) {
            const peers = Array.isArray(vpnInstance.peers) ? vpnInstance.peers : [];
            const vpnInstanceName = String(vpnInstance.name || '');

            for (const peer of peers) {
                peersToUpsert.push({
                    device: context.device,
                    snapshot: context.snapshot,
                    peer_ip: peer.peer,
                    address_family: 'vpnv6',
                    remote_as: peer.as_number || peer.as || 0,
                    state: peer.state,
                    up_down_time: peer.up_down_time,
                    msg_rcvd: peer.msg_received || peer.msg_rcvd || 0,
                    msg_sent: peer.msg_sent || 0,
                    version: peer.version || null,
                    out_queue: peer.out_queue || null,
                    prefixes_received: peer.prefixes_received || null,
                    vpn_instance: vpnInstanceName,
                });
            }
        }

        if (peersToUpsert.length > 0) {
            await this.bgpRepo.upsert(peersToUpsert);
            console.log(`[BgpVpnv6PeerIngestor] Upserted ${peersToUpsert.length} VPNv6 BGP peers.`);
        }
    }
}

