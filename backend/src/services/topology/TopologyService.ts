import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { IPhysicalLinkRepository } from "../../repositories/PhysicalLinkRepository";
import { Device } from "../../models/Device";
import {ISnapshotRepository} from "../../repositories/SnapshotRepository";

interface Node {
    id: number;
    label: string;
    model?: string;
}

interface Edge {
    from: number;
    to: number;
    label: string;
}

export interface Topology {
    nodes: Node[];
    edges: Edge[];
}

export interface ITopologyService {
    getTopology(): Promise<Topology>;
}

@injectable()
export class TopologyService implements ITopologyService {
    constructor(
        @inject(TYPES.PhysicalLinkRepository) private linkRepo: IPhysicalLinkRepository,
        @inject(TYPES.SnapshotRepository) private snapshotRepo: ISnapshotRepository,
    ) {}

    async getTopology(): Promise<Topology> {
        const latestSnapshot = await this.snapshotRepo.findLatest();
        const links = await this.linkRepo.findForTopology(latestSnapshot.id);

        const edges: Edge[] = [];
        const deviceMap = new Map<number, Device>();

        for (const link of links) {
            if (!link.source_interface?.device || !link.target_interface?.device) {
                continue;
            }

            const sourceDevice = link.source_interface.device;
            const targetDevice = link.target_interface.device;

            deviceMap.set(sourceDevice.id, sourceDevice);
            deviceMap.set(targetDevice.id, targetDevice);

            edges.push({
                from: sourceDevice.id,
                to: targetDevice.id,
                label: `${link.source_interface.name} ↔ ${link.target_interface.name}`,
            });
        }

        const nodes: Node[] = Array.from(deviceMap.values()).map(device => ({
            id: device.id,
            label: device.hostname,
            model: device.model,
        }));

        return { nodes, edges };
    }
}