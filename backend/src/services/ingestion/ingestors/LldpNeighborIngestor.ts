import {inject, injectable} from "inversify";
import {IIngestor} from "./IIngestor";
import {TYPES} from "../../../types";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";
import {IPhysicalLinkRepository} from "../../../repositories/PhysicalLinkRepository";
import {PhysicalLink} from "../../../models/PhysicalLink";

@injectable()
export class LldpNeighborIngestor implements IIngestor {
    readonly blockType = "display_lldp_neighbor_brief_block";
    readonly priority = 500;

    constructor(
        @inject(TYPES.PhysicalLinkRepository) private linkRepo: IPhysicalLinkRepository,
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const neighbors = Array.isArray(block?.neighbors) ? block.neighbors : [];
        if (neighbors.length === 0) return;

        const linksToUpsert = neighbors.map(neighbor => ({
            source_device_name: context.device.hostname,
            source_interface_name: neighbor.local_interface,
            target_device_name: neighbor.neighbor_device,
            target_interface_name: neighbor.neighbor_interface,
            snapshot: context.snapshot
        }))
        console.log(linksToUpsert);
        if (linksToUpsert.length > 0) {
            await this.linkRepo.upsert(linksToUpsert);
            console.log(`[LldpNeighborIngestor] Upserted ${linksToUpsert.length} physical links.`);
        }
    }
}