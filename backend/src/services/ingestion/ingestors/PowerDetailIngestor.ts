import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IHardwareComponentRepository} from "../../../repositories/HardwareComponentRepository";

@injectable()
export class PowerDetailIngestor implements IIngestor {
    readonly blockType = "display_power_detail_block";
    readonly priority = 90;

    constructor(
        @inject(TYPES.HardwareComponentRepository) private hwRepo: IHardwareComponentRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const powerId = block?.power_id;
        if (!powerId) {
            console.warn(`[PowerDetailIngestor] Block is missing a 'power_id'. Skipping.`);
            return;
        }

        const slot = parseInt(powerId, 10);
        if (isNaN(slot)) {
            console.warn(`[PowerDetailIngestor] Invalid 'power_id': ${powerId}. Skipping.`);
            return;
        }

        const componentUpdateData = {
            device: context.device,
            snapshot: context.snapshot,
            slot: slot,

            type: 'PWR',

            status: block.status,
            details: {
                power_supply_type: block.power_supply_type,
                present: block.present,
                cable: block.cable,
                mode: block.mode,
                input_voltage: block.inputvoltage,
                input_current: block.inputcurrent,
                total_power_watts: block.totalpower,
            }
        };

        await this.hwRepo.upsert([componentUpdateData]);
        console.log(`[PowerDetailIngestor] Enriched hardware component details for slot ${slot}.`);
    }
}