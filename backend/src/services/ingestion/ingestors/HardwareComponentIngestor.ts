import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {IHardwareComponentRepository} from "../../../repositories/HardwareComponentRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class HardwareComponentIngestor implements IIngestor {
    readonly blockType = "display_device_block";
    readonly priority = 80;

    constructor(
        @inject(TYPES.HardwareComponentRepository) private hwRepo: IHardwareComponentRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        if (block.model && context.device.model !== block.model) {
            context.device.model = block.model;
        }

        const rows = Array.isArray(block?.devices) ? block.devices : [];
        if (rows.length === 0) {
            return;
        }

        const componentsToUpsert = rows.map(row => ({
            device: context.device,
            snapshot: context.snapshot,
            slot: row.slot,

            type: row.type,
            online_status: row.online,
            register_status: row.register,
            status: row.status,
            role: row.role,
            primary_status: row.primary,
        }));

        await this.hwRepo.upsert(componentsToUpsert);
        console.log(`[DeviceBlockIngestor] Upserted ${componentsToUpsert.length} hardware components.`);
    }
}