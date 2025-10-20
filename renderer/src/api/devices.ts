import {APIResult} from "./types";
import {Metric} from "./analytics";

export interface Interface {
    id: number;
    name: string;
}

export interface Device {
    id: number;
    hostname: string;
    model?: string;
    firstSeenSnapshot?: {
        id: number;
        created_at: string;
        root_folder_path: string;
    };
    interfaces?: Interface[];
}

export async function getDevices(): Promise<APIResult<Device[]>> {
    if (window.electronAPI) {
        return window.electronAPI.getDevices();
    }
    console.warn("electronAPI not found. Using mock metrics.");
    return Promise.resolve({ success: true, data: [] });
}