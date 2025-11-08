import {APIResult} from "./types";
import {Device} from "./devices";

export interface Alarm {
    id: number;
    index: number;
    level: string;
    date: string;
    time: string;
    info: string
    oid: string;
    ent_code: number;
    device: Device;
}

export async function getAlarmsForSnapshot(snapshotId: number): Promise<APIResult<Alarm[]>> {
    if (window.electronAPI) {
        return window.electronAPI.getAlarms(snapshotId);
    }
    console.warn("electronAPI not found. Using mock alarms.");
    return Promise.resolve({ success: true, data: [] });
}