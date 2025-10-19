import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {IStorageSummaryRepository} from "../../../repositories/StorageSummaryRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class StorageSummaryIngestor implements IIngestor {
    readonly blockType = "dir_storage_summary_block";
    readonly priority = 110;

    constructor(
        @inject(TYPES.StorageSummaryRepository) private storageRepo: IStorageSummaryRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const summaryData = {
            snapshot: context.snapshot,
            device: context.device,

            total_kb: block.total_kb,
            free_kb: block.free_kb,
            total_mb: block.total_mb,
            free_mb: block.free_mb,
        };

        await this.storageRepo.upsert(summaryData);
        console.log(`[StorageSummaryIngestor] Upserted storage summary for device ${context.device.hostname}.`);
    }
}