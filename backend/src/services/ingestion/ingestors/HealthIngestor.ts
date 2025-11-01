import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IHardwareComponentRepository} from "../../../repositories/HardwareComponentRepository";

@injectable()
export class HealthIngestor implements IIngestor {
    readonly blockType = "display_health_block";
    readonly priority = 85;

    constructor(
        @inject(TYPES.HardwareComponentRepository) private hwRepo: IHardwareComponentRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const components = Array.isArray(block?.components) ? block.components : [];
        if (components.length === 0) {
            return;
        }

        const componentsToUpsert = components.map(comp => {
            const componentName = String(comp.component || '').trim();
            const type = componentName || 'UNKNOWN';

            return {
                device: context.device,
                snapshot: context.snapshot,
                slot: comp.slot,
                type: type,
                details: {
                    component: comp.component,
                    cpu_usage_percent: comp.cpu_usage_percent,
                    memory_usage_percent: comp.memory_usage_percent,
                    memory_used_mb: comp.memory_used_mb,
                    memory_total_mb: comp.memory_total_mb,
                }
            };
        });

        await this.hwRepo.upsert(componentsToUpsert);
        console.log(`[HealthIngestor] Upserted ${componentsToUpsert.length} health components.`);
    }
}

