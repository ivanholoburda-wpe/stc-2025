import {APIResult} from "./types";

export interface Node {
    id: string;
    label: string;
    model?: string;
}

export interface Edge {
    from: string;
    to: string;
    label: string;
}

export interface Topology {
    nodes: Node[];
    edges: Edge[];
}

export async function getTopology(): Promise<APIResult<Topology>> {
    return window.electronAPI.getTopology();
}