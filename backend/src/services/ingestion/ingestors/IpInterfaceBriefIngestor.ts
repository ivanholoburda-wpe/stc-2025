import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {IInterfaceRepository} from "../../../repositories/InterfaceRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class IpInterfaceBriefIngestor implements IIngestor {
    readonly blockType = "display_ip_interface_brief_block";
    readonly priority = 15;

    constructor(
        @inject(TYPES.InterfaceRepository) private ifaceRepo: IInterfaceRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const rows = Array.isArray(block?.interfaces) ? block.interfaces : [];
        if (rows.length === 0) {
            return;
        }

        const interfacesToUpsert = rows.map(row => {
            const ipAddress = String(row.ip_address_mask) === 'unassigned' ? null : String(row.ip_address_mask);

            return {
                name: String(row.interface),
                snapshot: context.snapshot,
                device: context.device,
                ip_address: ipAddress,
            };
        });

        await this.ifaceRepo.upsert(interfacesToUpsert);
        console.log(`[IpInterfaceBriefIngestor] Updated ${interfacesToUpsert.length} interfaces with IP addresses.`);
    }
}