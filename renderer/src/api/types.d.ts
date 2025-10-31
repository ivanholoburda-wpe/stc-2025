import {Snapshot} from "./snapshot";
import {Topology} from "./topology";
import {ExportResult, ReportDefinition} from "./export";
import {AppOptions} from "./options";

import {
    Device,
    Interface,
    IpRoute,
    BfdSession,
    BgpPeer,
    IsisPeer,
    ARPRecord,
    HardwareComponent,
    MplsL2vc,
    OspfDetail,
    VpnInstance,
} from "./devices";

export type OptionType = 'toggle' | 'text' | 'textarea' | 'secret' | 'number' | 'select';

export interface OptionWithType {
    id: number;
    option_name: string;
    option_value: string;
    option_type: OptionType;
}

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
    exportFlatReport: (snapshotId: number) => Promise<IPCResponse>;
    getTimeSeries: (metricId: string, deviceId: number, options?: {
        interfaceName?: string
    }) => Promise<APIResult<TimeSeriesDataPoint[]>>;
    getAlarms: (snapshotId: number) => Promise<APIResult<Alarm[]>>;
    getDeviceDetailsForSummary: (deviceId: number, snapshotId: number) => Promise<APIResult<Partial<Device>>>;
    getInterfacesForDevice: (deviceId: number, snapshotId: number) => Promise<APIResult<Interface[]>>;
    getRoutingForDevice: (deviceId: number, snapshotId: number) => Promise<APIResult<{
        ipRoutes: IpRoute[],
        arpRecords: ARPRecord[]
    }>>;
    getProtocolsForDevice: (deviceId: number, snapshotId: number) => Promise<APIResult<{
        bgpPeers: BgpPeer[],
        ospfDetails: OspfDetail[],
        isisPeers: IsisPeer[],
        bfdSessions: BfdSession[]
    }>>;
    getHardwareForDevice: (deviceId: number, snapshotId: number) => Promise<APIResult<HardwareComponent[]>>;
    getVpnForDevice: (deviceId: number, snapshotId: number) => Promise<APIResult<{
        mplsL2vcs: MplsL2vc[],
        vpnInstances: VpnInstance[]
    }>>;
    getAvailableReports: () => Promise<APIResult<ReportDefinition[]>>;
    exportReport: (reportId: string, snapshotId: number) => Promise<ExportResult>;
    getAllOptionsWithTypes: () => Promise<APIResult<OptionWithType[]>>;
    updateOptions: (options: AppOptions) => Promise<APIResult<void>>;
    clearData: () => Promise<APIResult<{ message?: string }>>;
    backupData: () => Promise<APIResult<{ path: string }>>;
    restoreData: () => Promise<APIResult<{ message?: string }>>;
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