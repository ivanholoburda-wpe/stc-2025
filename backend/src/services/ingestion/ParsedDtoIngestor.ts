import "reflect-metadata";
import {container} from "../../container";
import {IIngestor} from "./ingestors/IIngestor";
import {TYPES} from "../../types";
import {Snapshot} from "../../models/Snapshot";
import {Device} from "../../models/Device";
import {IngestionContext} from "./ingestors/IngestionContext";
import {ParserBlock, ParserResults} from "./ingestors/types";

export class ParsedDtoIngestor {
    private readonly ingestors: IIngestor[];

    constructor() {
        this.ingestors = container.getAll<IIngestor>(TYPES.IIngestor)
            .sort((a, b) => a.priority - b.priority);
    }

    async ingest(results: ParserResults, snapshot: Snapshot, device: Device): Promise<void> {
        results.data.forEach((block) => {
            if (block.type === 'display_device_block') {
                console.log(block)
            }
        })

        if (!results?.data || !Array.isArray(results.data)) {
            return;
        }

        const context = new IngestionContext(snapshot, device);

        for (const ingestor of this.ingestors) {
            const blocksToProcess = results.data.filter(block => block.type === ingestor.blockType);

            for (const block of blocksToProcess) {
                try {
                    await ingestor.ingest(block, context);
                } catch (error) {
                    console.error(`Error during ingestion with ${ingestor.constructor.name} for block type ${ingestor.blockType}`, error);
                }
            }
        }
    }
}