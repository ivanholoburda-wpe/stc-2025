import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {IInterfaceRepository} from "../../../repositories/InterfaceRepository";
import {TYPES} from "../../../types";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class InterfaceBriefIngestor implements IIngestor {
    readonly blockType = "display_interface_brief_block";
    readonly priority = 10;

    constructor(
        @inject(TYPES.InterfaceRepository) private ifaceRepo: IInterfaceRepository
    ) {
    }

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const rows = Array.isArray(block?.interfaces) ? block.interfaces : [];
        if (rows.length === 0) {
            return;
        }

        const interfacesToUpsert = rows.map(row => ({
            name: String(row.interface),
            snapshot: context.snapshot,
            device: context.device,
            phy_status: String(row.phy_status),
            protocol_status: String(row.protocol_status),
        }));

        await this.ifaceRepo.upsert(interfacesToUpsert);

        const interfaceNames = interfacesToUpsert.map(iface => iface.name);
        const upsertedInterfaces = await this.ifaceRepo.findByNamesAndSnapshot(
            interfaceNames,
            context.device.id,
            context.snapshot.id
        );

        for (const iface of upsertedInterfaces) {
            context.interfaceCache.set(iface.name, iface);
        }
    }
}