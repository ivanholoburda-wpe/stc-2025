import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IHardwareComponentRepository} from "../../../repositories/HardwareComponentRepository";

@injectable()
export class IpuDetailIngestor implements IIngestor {
    readonly blockType = "display_ipu_detail_block";
    readonly priority = 90;

    constructor(
        @inject(TYPES.HardwareComponentRepository) private hwRepo: IHardwareComponentRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const slot = block?.slot;
        if (typeof slot !== 'number') {
            console.warn(`[IpuDetailIngestor] Block is missing a valid 'slot'. Skipping.`);
            return;
        }

        const componentUpdateData = {
            device: context.device,
            snapshot: context.snapshot,
            slot: slot,
            type: 'IPU',

            model: block.ipu_model,
            status: block.board_status,
            details: {
                description: block.description,
                register_status: block.register,
                uptime: block.uptime,
                cpu_utilization: block.cpu_utilization,
                mem_usage: block.mem_usage,
                statistics: block.statistics,
                pics: block.pics,
            }
        };

        await this.hwRepo.upsert([componentUpdateData]);
        console.log(`[IpuDetailIngestor] Enriched hardware component details for slot ${slot}.`);
    }
}