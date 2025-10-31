import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { IPhysicalLinkRepository } from "../../repositories/PhysicalLinkRepository";
import { ISnapshotRepository } from "../../repositories/SnapshotRepository";

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

        const deviceNameToId = new Map<string, number>();
        const nodes: Node[] = [];
        let nextId = 1;

        const snapshotDevicesByHostname = new Map<string, { model?: string }>();
        const snapshotDevices: any[] = (latestSnapshot as any).devices ?? [];
        for (const d of snapshotDevices) {
            snapshotDevicesByHostname.set(d.hostname, { model: d.model });
        }

        const getOrCreateNodeId = (deviceName: string): number => {
            let existing = deviceNameToId.get(deviceName);
            if (existing) return existing;

            const id = nextId++;
            deviceNameToId.set(deviceName, id);

            const extra = snapshotDevicesByHostname.get(deviceName);
            nodes.push({
                id,
                label: deviceName,
                model: extra?.model,
            });

            return id;
        };

        for (const link of links) {
            const sourceName = link.source_device_name;
            const targetName = link.target_device_name;
            if (!sourceName || !targetName) continue;

            const fromId = getOrCreateNodeId(sourceName);
            const toId = getOrCreateNodeId(targetName);

            edges.push({
                from: fromId,
                to: toId,
                label: `${link.source_interface_name} ↔ ${link.target_interface_name}`,
            });
        }

        return { nodes, edges };
    }
}