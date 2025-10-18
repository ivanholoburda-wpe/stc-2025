import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";

export interface IIngestor {
    readonly blockType: string;
    readonly priority: number;

    ingest(block: ParserBlock, context: IngestionContext): Promise<void>;
}