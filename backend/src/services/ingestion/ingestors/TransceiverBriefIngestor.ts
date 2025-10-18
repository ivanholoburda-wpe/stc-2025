import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {ITransceiverRepository} from "../../../repositories/TransceiverRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";
import {Transceiver} from "../../../models/Transceiver";
import {normalizeInterfaceName} from "../helpers";

@injectable()
export class TransceiverBriefIngestor implements IIngestor {
    readonly blockType = "display_optical_module_brief_block";
    readonly priority = 20;

    constructor(
        @inject(TYPES.TransceiverRepository) private trxRepo: ITransceiverRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const rows = Array.isArray(block?.modules) ? block.modules : [];
        if (rows.length === 0) return;

        const transceiversToUpsert = rows.map(row => {
            const interfaceName = normalizeInterfaceName(row.port, row.type);

            const parentInterface = context.interfaceCache.get(interfaceName);

            if (!parentInterface) {
                console.warn(`[ingestTransceiverBrief] Interface '${interfaceName}' not found in cache. Skipping transceiver.`);
                return null;
            }

            const wavelengthValue = row.wavelength ? parseFloat(row.wavelength) : undefined;

            const transceiverData: Partial<Transceiver> = {
                interface: parentInterface,
                snapshot: context.snapshot,
                device: context.device,
                name: `${parentInterface.name} transceiver`,
                status: row.status,
                duplex: row.duplex,
                type: row.type,
                mode: row.mode,
                vendor_pn: row.vendor_pn,
                lanes: row.lanes,
                wavelength: !isNaN(wavelengthValue) ? wavelengthValue : undefined,
                rx_power: typeof row.rx_power_dbm === 'number' ? row.rx_power_dbm : undefined,
                tx_power: typeof row.tx_power_dbm === 'number' ? row.tx_power_dbm : undefined,
            };

            return transceiverData;
        }).filter((t): t is Partial<Transceiver> => t !== null);

        await this.trxRepo.upsert(transceiversToUpsert);
        console.log(`[TransceiverBriefIngestor] Processed ${transceiversToUpsert.length} transceivers.`);
    }
}