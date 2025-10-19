import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {ICpuUsageRepository} from "../../../repositories/CpuUsageRepository";

@injectable()
export class CpuUsageIngestor implements IIngestor {
    readonly blockType = "display_cpu_usage_block";
    readonly priority = 120;

    constructor(
        @inject(TYPES.CpuUsageRepository) private cpuRepo: ICpuUsageRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const summaryData = {
            snapshot: context.snapshot,
            device: context.device,

            timestamp: block.timestamp,
            system_cpu_use_rate_percent: block.system_cpu_use_rate_percent,
            cpu_avg: block.cpu_avg,
            max_cpu_usage_percent: block.max_cpu_usage_percent,
            max_cpu_usage_time: block.max_cpu_usage_time,
            service_details: Array.isArray(block?.services) ? block.services : [],
        };

        await this.cpuRepo.upsert(summaryData);
        console.log(`[CpuUsageIngestor] Saved CPU usage summary for device ${context.device.hostname}.`);
    }
}