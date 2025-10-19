import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IIsisPeerRepository} from "../../../repositories/IsisPeerRepository";

@injectable()
export class IsisPeerIngestor implements IIngestor {
    readonly blockType = "display_isis_peer_block";
    readonly priority = 130;

    constructor(
        @inject(TYPES.IsisPeerRepository) private isisRepo: IIsisPeerRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const peers = Array.isArray(block?.peers) ? block.peers : [];
        if (peers.length === 0) return;

        const peersToUpsert = peers.map(peer => {
            const interfaceName = String(peer.interface);
            const parentInterface = context.interfaceCache.get(interfaceName);

            if (!parentInterface) {
                console.warn(`[IsisPeerIngestor] Interface '${interfaceName}' not found in cache. Skipping ISIS peer.`);
                return null;
            }

            return {
                interface: parentInterface,
                system_id: peer.system_id,
                type: peer.type,
                device: context.device,
                snapshot: context.snapshot,

                process_id: block.process_id,
                circuit_id: peer.circuit_id,
                state: peer.state,
                hold_time: peer.hold_time,
                priority: peer.priority,
            };
        }).filter(p => p !== null);

        if (peersToUpsert.length > 0) {
            await this.isisRepo.upsert(peersToUpsert);
            console.log(`[IsisPeerIngestor] Upserted ${peersToUpsert.length} ISIS peers.`);
        }
    }
}