import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IHardwareComponentRepository} from "../../../repositories/HardwareComponentRepository";

@injectable()
export class FanDetailIngestor implements IIngestor {
    readonly blockType = "display_fan_detail_block";
    readonly priority = 90;

    constructor(
        @inject(TYPES.HardwareComponentRepository) private hwRepo: IHardwareComponentRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const fanId = block?.fan_id;
        if (!fanId) {
            console.warn(`[FanDetailIngestor] Block is missing a 'fan_id'. Skipping.`);
            return;
        }

        const slot = parseInt(fanId, 10);
        if (isNaN(slot)) {
            console.warn(`[FanDetailIngestor] Invalid 'fan_id': ${fanId}. Skipping.`);
            return;
        }

        const componentUpdateData = {
            device: context.device,
            snapshot: context.snapshot,
            slot: slot,

            type: 'FAN',

            status: block.status,
            details: {
                present: block.present,
                cable: block.cable,
                registered: block.register,
                is_working: block.work,
                fan_speeds_percent: block.fan_speeds_percent,
            }
        };

        await this.hwRepo.upsert([componentUpdateData]);
        console.log(`[FanDetailIngestor] Enriched hardware component details for slot ${slot}.`);
    }
}