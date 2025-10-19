import {ISnapshotService} from "../services/snapshot/SnapshotService";
import {inject, injectable} from "inversify";
import {ITopologyService, Topology} from "../services/topology/TopologyService";
import {TYPES} from "../types";
import {Snapshot} from "../models/Snapshot";

@injectable()
export class TopologyHandler {
    constructor(
        @inject(TYPES.TopologyService) private readonly topologyService: ITopologyService,
    ) {
    }

    public async getTopology() {
        try {
            const topology: Topology = await this.topologyService.getTopology();
            return {
                success: true,
                data: topology,
            }
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            }
        }
    }
}