import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IPortVlanRepository} from "../../../repositories/PortVlanRepository";

@injectable()
export class PortVlanIngestor implements IIngestor {
    readonly blockType = "display_port_vlan_block";
    readonly priority = 20;

    constructor(
        @inject(TYPES.PortVlanRepository) private portVlanRepo: IPortVlanRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const ports = Array.isArray(block?.ports) ? block.ports : [];
        if (ports.length === 0) {
            return;
        }

        const portVlansToUpsert = ports.map(port => ({
            device: context.device,
            snapshot: context.snapshot,
            port_name: String(port.port || ''),
            link_type: port.link_type,
            pvid: port.pvid,
            vlan_list: port.vlan_list,
        }));

        await this.portVlanRepo.upsert(portVlansToUpsert);
        console.log(`[PortVlanIngestor] Upserted ${portVlansToUpsert.length} port-VLAN mappings.`);
    }
}

