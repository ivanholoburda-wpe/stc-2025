import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import { TYPES } from "../../../types";
import { IETrunkRepository } from "../../../repositories/ETrunkRepository";

@injectable()
export class ETrunkBriefIngestor implements IIngestor {
    readonly blockType = "display_etrunk_brief_block";
    readonly priority = 64;

    constructor(
        @inject(TYPES.ETrunkRepository) private etrunkRepo: IETrunkRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const etrunks = Array.isArray(block?.etrunks) ? block.etrunks : [];
        if (etrunks.length === 0) {
            return;
        }

        const etrunksToUpsert = etrunks.map(etrunk => ({
            device: context.device,
            snapshot: context.snapshot,
            etrunk_id: etrunk.id,
            state: etrunk.state || null,
            vpn_instance: etrunk.vpn_instance || null,
            peer_ip: etrunk.peer_ip || null,
            source_ip: etrunk.source_ip || null,
        }));

        await this.etrunkRepo.upsert(etrunksToUpsert);
        console.log(`[ETrunkBriefIngestor] Upserted ${etrunksToUpsert.length} E-Trunk entries.`);
    }
}

