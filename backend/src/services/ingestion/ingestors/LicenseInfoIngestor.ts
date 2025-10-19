import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {ILicenseInfoRepository} from "../../../repositories/LicenseInfoRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class LicenseInfoIngestor implements IIngestor {
    readonly blockType = "display_license_info_block";
    readonly priority = 170;

    constructor(
        @inject(TYPES.LicenseInfoRepository) private licenseRepo: ILicenseInfoRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const licenseData = {
            snapshot: context.snapshot,
            device: context.device,
            active_license_path: block.active_license,
            state: block.license_state,
            product_name: block.product_name,
            product_version: block.product_version,
            serial_no: block.license_serial_no,
            creator: block.creator,
            created_time: block.created_time,
        };

        await this.licenseRepo.upsert(licenseData);
        console.log(`[LicenseInfoIngestor] Upserted license info for device ${context.device.hostname}.`);
    }
}