import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { IPhysicalLinkRepository } from "../../repositories/PhysicalLinkRepository";
import {ISnapshotRepository} from "../../repositories/SnapshotRepository";

interface Node {
    id: string;
    label: string;
    model?: string;
}

interface Edge {
    from: string;
    to: string;
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
        const nodes = new Map<string, Node>();

        for (const link of links) {
            const sourceDevice = link.source_interface?.device;
            const targetDevice = link.target_interface?.device;

            if (!sourceDevice || !targetDevice) {
                continue;
            }

            const sourceDeviceName = sourceDevice.hostname ?? sourceDevice.folder_name;
            const targetDeviceName = targetDevice.hostname ?? targetDevice.folder_name;

            if (!sourceDeviceName || !targetDeviceName) {
                continue;
            }

            if (!nodes.has(sourceDeviceName)) {
                nodes.set(sourceDeviceName, {
                    id: sourceDeviceName,
                    label: sourceDeviceName,
                    model: sourceDevice.model,
                });
            }

            if (!nodes.has(targetDeviceName)) {
                nodes.set(targetDeviceName, {
                    id: targetDeviceName,
                    label: targetDeviceName,
                    model: targetDevice.model,
                });
            }

            edges.push({
                from: sourceDeviceName,
                to: targetDeviceName,
                label: `${link.source_interface.name} ↔ ${link.target_interface.name}`,
            });
        }

        return { nodes: Array.from(nodes.values()), edges };
    }
}