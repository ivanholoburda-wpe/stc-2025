import {inject, injectable} from "inversify";
import {IIngestor} from "./IIngestor";
import {TYPES} from "../../../types";
import {IDeviceRepository} from "../../../repositories/DeviceRepository";
import {IInterfaceRepository} from "../../../repositories/InterfaceRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";
import {IPhysicalLinkRepository} from "../../../repositories/PhysicalLinkRepository";
import {normalizeInterfaceNameLLDP} from "../helpers";

@injectable()
export class LldpNeighborIngestor implements IIngestor {
    readonly blockType = "display_lldp_neighbor_brief_block";
    readonly priority = 500;

    constructor(
        @inject(TYPES.DeviceRepository) private deviceRepo: IDeviceRepository,
        @inject(TYPES.InterfaceRepository) private ifaceRepo: IInterfaceRepository,
        @inject(TYPES.PhysicalLinkRepository) private linkRepo: IPhysicalLinkRepository,
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const neighbors = Array.isArray(block?.neighbors) ? block.neighbors : [];
        if (neighbors.length === 0) return;
        const neighborHostnames = neighbors.map(n => n.neighbor_device);
        if (neighborHostnames.length === 0) return;
        const targetDevices = await this.deviceRepo.findByHostnames(neighborHostnames);

        const targetDeviceIds = targetDevices.map(d => d.id);
        const targetInterfaceNames = neighbors.map(n => normalizeInterfaceNameLLDP(n.neighbor_interface));
        const targetInterfaces = await this.ifaceRepo.findByNamesAndDeviceIds(
            targetInterfaceNames,
            targetDeviceIds,
            context.snapshot.id
        );

        const deviceMap = new Map(targetDevices.map(d => [d.hostname, d]));
        const interfaceMap = new Map(targetInterfaces.map(i => [`${i.device.id}-${i.name}`, i]));

        const linksToUpsert = [];
        for (const neighbor of neighbors) {
            const sourceInterface = context.interfaceCache.get(normalizeInterfaceNameLLDP(neighbor.local_interface));
            const targetDevice = deviceMap.get(neighbor.neighbor_device);

            if (!sourceInterface || !targetDevice) continue;

            const targetInterface = interfaceMap.get(`${targetDevice.id}-${normalizeInterfaceNameLLDP(neighbor.neighbor_interface)}`);
            if (!targetInterface) continue;

            const [linkSource, linkTarget] = [sourceInterface, targetInterface].sort((a, b) => a.id - b.id);

            linksToUpsert.push({
                snapshot: context.snapshot,
                source_interface: linkSource,
                target_interface: linkTarget,
            });
        }

        if (linksToUpsert.length > 0) {
            await this.linkRepo.upsert(linksToUpsert);
            console.log(`[LldpNeighborIngestor] Upserted ${linksToUpsert.length} physical links.`);
        }
    }
}