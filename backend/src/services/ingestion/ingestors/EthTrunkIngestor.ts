import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IEthTrunkRepository} from "../../../repositories/EthTrunkRepository";

@injectable()
export class EthTrunkIngestor implements IIngestor {
    readonly blockType = "display_eth_trunk_detail_block";
    readonly priority = 65;

    constructor(
        @inject(TYPES.EthTrunkRepository) private trunkRepo: IEthTrunkRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const trunks = Array.isArray(block?.trunks) ? block.trunks : [];
        if (trunks.length === 0) {
            return;
        }

        const trunksToUpsert = trunks.map(trunk => {
            const localInfo = trunk.local_info || {};
            
            return {
                device: context.device,
                snapshot: context.snapshot,
                trunk_id: trunk.id,
                mode_type: trunk.mode_type || null,
                working_mode: localInfo.workingmode || localInfo.working_mode || null,
                operating_status: localInfo.operating_status || localInfo.operate_status || null,
                number_of_up_ports: localInfo.number_of_up_ports_in_trunk || null,
                local_info: localInfo,
                ports_info: {
                    actor_ports: trunk.actor_ports || [],
                    partner_ports: trunk.partner_ports || [],
                    normal_ports: trunk.normal_ports || [],
                }
            };
        });

        await this.trunkRepo.upsert(trunksToUpsert);
        console.log(`[EthTrunkIngestor] Upserted ${trunksToUpsert.length} trunk interfaces.`);
    }
}

