import {inject, injectable} from "inversify";
import {IIngestor} from "./IIngestor";
import {IBfdRepository} from "../../../repositories/BfdSessionRepository";
import {TYPES} from "../../../types";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class BfdIngestor implements IIngestor {
    readonly blockType = "display_bfd_session_all_block";
    readonly priority = 60;

    constructor(
        @inject(TYPES.BfdRepository) private bfdRepo: IBfdRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const rows = Array.isArray(block?.sessions) ? block.sessions : [];
        if (rows.length === 0) return;

        const sessionsToUpsert = rows.map(row => {
            const interfaceName = String(row.interface_name);

            const parentInterface = context.interfaceCache.get(interfaceName);

            if (!parentInterface) {
                console.warn(`[BfdIngestor] Interface '${interfaceName}' not found in cache. Skipping BFD session.`);
                return null;
            }

            return {
                interface: parentInterface,
                device: context.device,
                snapshot: context.snapshot,

                local_discriminator: row.local_discriminator,
                remote_discriminator: row.remote_discriminator,
                peer_ip_address: row.peer_ip_address,
                state: row.state,
                type: row.type,
            };
        }).filter(s => s !== null);

        if (sessionsToUpsert.length > 0) {
            await this.bfdRepo.upsert(sessionsToUpsert);
        }
    }
}