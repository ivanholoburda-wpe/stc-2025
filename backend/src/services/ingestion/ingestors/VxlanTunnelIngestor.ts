import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IVxlanTunnelRepository} from "../../../repositories/VxlanTunnelRepository";

@injectable()
export class VxlanTunnelIngestor implements IIngestor {
    readonly blockType = "display_vxlan_tunnel_block";
    readonly priority = 130;

    constructor(
        @inject(TYPES.VxlanTunnelRepository) private tunnelRepo: IVxlanTunnelRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const vpnInstances = Array.isArray(block?.vpn_instances) ? block.vpn_instances : [];
        if (vpnInstances.length === 0) {
            return;
        }

        const tunnelsToUpsert: any[] = [];

        for (const vpnInstance of vpnInstances) {
            const tunnels = Array.isArray(vpnInstance.tunnels) ? vpnInstance.tunnels : [];
            const vpnInstanceName = String(vpnInstance.name || '');

            for (const tunnel of tunnels) {
                tunnelsToUpsert.push({
                    device: context.device,
                    snapshot: context.snapshot,
                    vpn_instance: vpnInstanceName,
                    tunnel_id: tunnel.tunnel_id,
                    source: tunnel.source,
                    destination: tunnel.destination,
                    state: tunnel.state,
                    type: tunnel.type,
                    uptime: tunnel.uptime,
                });
            }
        }

        if (tunnelsToUpsert.length > 0) {
            await this.tunnelRepo.upsert(tunnelsToUpsert);
            console.log(`[VxlanTunnelIngestor] Upserted ${tunnelsToUpsert.length} VXLAN tunnels.`);
        }
    }
}

