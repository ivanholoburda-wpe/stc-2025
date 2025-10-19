import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {IOspfInterfaceRepository} from "../../../repositories/OspfInterfaceRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class OspfInterfaceIngestor implements IIngestor {
    readonly blockType = "display_ospf_interface_verbose_block";
    readonly priority = 190;

    constructor(
        @inject(TYPES.OspfInterfaceRepository) private ospfRepo: IOspfInterfaceRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const interfaceName = String(block.interface);
        const parentInterface = context.interfaceCache.get(interfaceName);

        if (!parentInterface) {
            console.warn(`[OspfInterfaceIngestor] Interface '${interfaceName}' not found in cache. Skipping.`);
            return;
        }

        const ospfData = {
            interface: parentInterface,
            device: context.device,
            snapshot: context.snapshot,
            ip_address: block.ip,
            cost: block.cost,
            state: block.state,
            type: block.interface_type,
            hello_timer: block.timers?.hello,
            dead_timer: block.timers?.dead,
            retransmit_timer: block.timers?.retransmit,
            bfd_tx_interval: block.bfd_timers?.tx_interval,
            bfd_rx_interval: block.bfd_timers?.rx_interval,
            bfd_multiplier: block.bfd_timers?.multiplier,
            hello_in: block.statistics?.hello?.input,
            hello_out: block.statistics?.hello?.output,
            dbd_in: block.statistics?.db_description?.input,
            dbd_out: block.statistics?.db_description?.output,
            lsr_in: block.statistics?.lsr?.input,
            lsr_out: block.statistics?.lsr?.output,
            lsu_in: block.statistics?.lsu?.input,
            lsu_out: block.statistics?.lsu?.output,
            lsack_in: block.statistics?.lsack?.input,
            lsack_out: block.statistics?.lsack?.output,
        };

        await this.ospfRepo.upsert(ospfData);
        console.log(`[OspfInterfaceIngestor] Upserted OSPF details for interface ${interfaceName}.`);
    }
}