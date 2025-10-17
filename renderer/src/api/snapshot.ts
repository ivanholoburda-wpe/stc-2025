import {APIResult} from "./types";

export interface Snapshot {
    id: number;
    created_at: string;
    root_folder_path: string;
    description: string;
}

export async function getSnapshots(): Promise<APIResult<Snapshot[]>> {
    return window.electronAPI.getAllSnapshots();
}

export async function analyzeSnapshot(snapshotId: number, prompt: string): Promise<APIResult<string>> {
    return await window.electronAPI.analyzeSnapshot(snapshotId, prompt);
}