import {APIResult} from "./types";

export interface Node {
    id: number;
    label: string;
    model?: string;
}

export interface Edge {
    from: number;
    to: number;
    label: string;
}

export interface Topology {
    nodes: Node[];
    edges: Edge[];
}

export async function getTopology(): Promise<APIResult<Topology>> {
    return window.electronAPI.getTopology();
}