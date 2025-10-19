import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {IStpRepository} from "../../../repositories/StpRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class StpIngestor implements IIngestor {
    readonly blockType = "display_stp_brief_block";
    readonly priority = 70;

    constructor(
        @inject(TYPES.StpRepository) private stpRepo: IStpRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const stpData = {
            snapshot: context.snapshot,
            device: context.device,

            protocol_status: block.protocol_status,
            protocol_standard: block.protocol_standard,
            version: block.version,
            cist_bridge_priority: block.cist_bridge_priority,
            mac_address: block.mac_address,
            max_age: block.max_age,
            forward_delay: block.forward_delay,
            hello_time: block.hello_time,
            max_hops: block.max_hops,
        };

        await this.stpRepo.upsert(stpData);
        console.log(`[StpIngestor] Upserted STP configuration for device ${context.device.hostname}.`);
    }
}