import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IVlanRepository} from "../../../repositories/VlanRepository";

@injectable()
export class VlanIngestor implements IIngestor {
    readonly blockType = "display_vlan_block";
    readonly priority = 55;

    constructor(
        @inject(TYPES.VlanRepository) private vlanRepo: IVlanRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const vlans = Array.isArray(block?.vlans) ? block.vlans : [];
        if (vlans.length === 0) {
            return;
        }

        const vlansToUpsert = vlans.map(vlan => ({
            device: context.device,
            snapshot: context.snapshot,
            vid: vlan.vid,
            status: vlan.status,
            property: vlan.property,
            mac_learn: vlan.mac_learn,
            statistics: vlan.statistics,
            description: vlan.description,
        }));

        await this.vlanRepo.upsert(vlansToUpsert);
        console.log(`[VlanIngestor] Upserted ${vlansToUpsert.length} VLANs.`);
    }
}

