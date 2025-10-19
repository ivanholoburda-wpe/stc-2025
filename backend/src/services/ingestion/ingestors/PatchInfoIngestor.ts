import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {IPatchInfoRepository} from "../../../repositories/PatchInfoRepository";
import {TYPES} from "../../../types";

@injectable()
export class PatchInfoIngestor implements IIngestor {
    readonly blockType = "display_patch_info_block";
    readonly priority = 150;

    constructor(
        @inject(TYPES.PatchInfoRepository) private patchRepo: IPatchInfoRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const patchData = {
            snapshot: context.snapshot,
            device: context.device,

            patch_exists: block.patch_exists,
            package_name: block.patch_package_name,
            package_version: block.patch_package_version,
            state: block.the_current_state_is,
            details: block.details,
        };

        await this.patchRepo.upsert(patchData);
        console.log(`[PatchInfoIngestor] Upserted patch info for device ${context.device.hostname}.`);
    }
}