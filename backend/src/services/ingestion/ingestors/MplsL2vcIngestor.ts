import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {IMplsL2vcRepository} from "../../../repositories/MplsL2vcRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class MplsL2vcIngestor implements IIngestor {
    readonly blockType = "display_mpls_l2vc_block";
    readonly priority = 180;

    constructor(
        @inject(TYPES.MplsL2vcRepository) private mplsRepo: IMplsL2vcRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const interfaceName = String(block.interface);
        const parentInterface = context.interfaceCache.get(interfaceName);

        if (!parentInterface) {
            console.warn(`[MplsL2vcIngestor] Interface '${interfaceName}' not found in cache. Skipping.`);
            return;
        }

        const vcData = {
            interface: parentInterface,
            vc_id: block.vc_id,
            destination: block.destination,
            device: context.device,
            snapshot: context.snapshot,

            interface_state: block.interface_state,
            session_state: block.session_state,
            vc_type: block.vc_type,
            local_label: block.labels?.local,
            remote_label: block.labels?.remote,
            local_mtu: block.mtu?.local,
            remote_mtu: block.mtu?.remote,
            primary_tunnel_type: block.tunnels?.primary?.type,
            primary_tunnel_id: block.tunnels?.primary?.id,
            backup_tunnel_type: block.tunnels?.backup?.type,
            backup_tunnel_id: block.tunnels?.backup?.id,
            create_time: block.create_time,
            up_time: block.up_time,
            last_up_time: block.last_up_time,
        };

        await this.mplsRepo.upsert(vcData);
        console.log(`[MplsL2vcIngestor] Upserted MPLS L2VC for interface ${interfaceName}.`);
    }
}