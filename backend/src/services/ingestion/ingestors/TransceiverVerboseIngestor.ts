import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {ITransceiverRepository} from "../../../repositories/TransceiverRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";
import {Transceiver} from "../../../models/Transceiver";

@injectable()
export class TransceiverVerboseIngestor implements IIngestor {
    readonly blockType = "display_transceiver_verbose_block";
    readonly priority = 30;

    constructor(
        @inject(TYPES.TransceiverRepository) private trxRepo: ITransceiverRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const ifaceName: string | undefined = block?.interface;
        if (!ifaceName) {
            return;
        }

        const parentInterface = context.interfaceCache.get(ifaceName);

        if (!parentInterface) {
            console.warn(`[TransceiverVerbose] Interface '${ifaceName}' not in cache. Cannot update transceiver details.`);
            return;
        }

        const transceiverData: Partial<Transceiver> = {
            interface: parentInterface,
            device: context.device,
            snapshot: context.snapshot,
            name: `${parentInterface.name} transceiver`,
            serial_number: block?.manufacture_information?.manu_serial_number,
            wavelength: block?.common_information?.wavelength,
            tx_power: block?.diagnostic_information?.tx_power,
            rx_power: block?.diagnostic_information?.rx_power,
            tx_warning_min: block?.diagnostic_information?.tx_power_low_threshold,
            tx_warning_max: block?.diagnostic_information?.tx_power_high_threshold,
            rx_warning_min: block?.diagnostic_information?.rx_power_low_threshold,
            rx_warning_max: block?.diagnostic_information?.rx_power_high_threshold,
        };

        await this.trxRepo.upsert([transceiverData]);
        console.log(`[TransceiverVerboseIngestor] Enriched transceiver details for interface ${ifaceName}.`);
    }
}