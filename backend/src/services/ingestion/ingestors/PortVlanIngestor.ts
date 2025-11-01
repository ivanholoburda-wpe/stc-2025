import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IPortVlanRepository} from "../../../repositories/PortVlanRepository";
import {IInterfaceRepository} from "../../../repositories/InterfaceRepository";

@injectable()
export class PortVlanIngestor implements IIngestor {
    readonly blockType = "display_port_vlan_block";
    readonly priority = 20;

    constructor(
        @inject(TYPES.PortVlanRepository) private portVlanRepo: IPortVlanRepository,
        @inject(TYPES.InterfaceRepository) private ifaceRepo: IInterfaceRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const ports = Array.isArray(block?.ports) ? block.ports : [];
        if (ports.length === 0) {
            return;
        }

        const portNames = ports.map(p => p.port).filter(Boolean);
        const interfaces = await this.ifaceRepo.findByNamesAndSnapshot(
            portNames,
            context.device.id,
            context.snapshot.id
        );
        
        const interfaceMap = new Map(interfaces.map(iface => [iface.name, iface]));

        const portVlansToUpsert = ports.map(port => {
            const interfaceName = String(port.port || '');
            const parentInterface = interfaceMap.get(interfaceName) || null;

            return {
                device: context.device,
                snapshot: context.snapshot,
                interface: parentInterface,
                port_name: interfaceName,
                link_type: port.link_type,
                pvid: port.pvid,
                vlan_list: port.vlan_list,
            };
        });

        await this.portVlanRepo.upsert(portVlansToUpsert);
        console.log(`[PortVlanIngestor] Upserted ${portVlansToUpsert.length} port-VLAN mappings.`);
    }
}

