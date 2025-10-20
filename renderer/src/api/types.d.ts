import {Snapshot} from "./snapshot";
import {Topology} from "./topology";
import {Device} from "./devices";

export interface ParsingResult {
    success: boolean,
    data: any,
    message: string,
}

export interface APIResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

interface ElectronAPI {
    runParsing: () => Promise<ParsingResult>;
    getDevices: () => Promise<APIResult<Device[]>>;
    getAllSnapshots: () => Promise<APIResult<Snapshot[]>>;
    createDevice: (device: { hostname: string; model?: string }) => Promise<APIResult<Device>>;
    analyzeSnapshot: (snapshotId: number, prompt: string) => Promise<APIResult<string>>;
    getTopology: () => Promise<APIResult<Topology>>;
    getAvailableMetrics: () => Promise<APIResult<Metric[]>>;
    getTimeSeries: (metricId: string, deviceId: number, options?: { interfaceName?: string }) => Promise<APIResult<TimeSeriesDataPoint[]>>;
    getAlarms: (snapshotId: number) => Promise<APIResult<Alarm[]>>;
}

interface ConfigAPI {
    isOfflineMode: () => Promise<boolean>;
    getAiModelKey: () => Promise<string | null>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
        configAPI: ConfigAPI;
    }
}