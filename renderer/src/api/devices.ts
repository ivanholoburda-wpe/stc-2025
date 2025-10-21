import {APIResult} from "./types";

export type Interface = {
    id: number;
    name: string;
    phy_status?: string;
    protocol_status?: string;
    ip_address?: string;
    description?: string;
    mtu?: number;
    transceivers: Transceiver[];
};
export type Transceiver = {
    id: number;
    status?: string;
    type?: string;
    rx_power?: number;
    tx_power?: number;
    vendor_pn?: string;
    serial_number?: string;
    wavelength?: number;
};
export type BgpPeer = {
    id: number;
    peer_ip: string;
    remote_as: number;
    state: string;
    address_family: string;
    msg_rcvd: number;
    msg_sent: number;
};
export type OspfDetail = { id: number; interface: Interface; cost: number; state: string; type: string; };
export type HardwareComponent = {
    id: number;
    slot: number;
    type: string;
    model?: string;
    status?: string;
    role?: string;
    details?: any;
};
export type CpuSummary = {
    id: number;
    system_cpu_use_rate_percent: number;
    max_cpu_usage_percent: number;
    cpu_avg: any;
    service_details: any[];
};
export type StorageSummary = { id: number; total_mb: number; free_mb: number; };
export type LicenseInfo = { id: number; product_name: string; state: string; serial_no?: string; };
export type PatchInfo = { id: number; patch_exists: boolean; package_name?: string; package_version?: string; };
export type StpConfiguration = {
    id: number;
    protocol_status?: string;
    protocol_standard?: string;
    mac_address?: string;
};
export type ARPRecord = {
    id: number;
    ip_address: string;
    mac_address: string;
    type?: string;
    interface?: Interface;
    vlan?: number;
};
export type BfdSession = {
    id: number;
    interface: Interface;
    peer_ip_address: string;
    state: string;
    type: string;
    local_discriminator: number;
};
export type IpRoute = {
    id: number;
    destination_mask: string;
    protocol: string;
    next_hop: string;
    interface?: Interface | null;
    preference: number;
    cost: number;
};
export type IsisPeer = {
    id: number;
    interface: Interface;
    system_id: string;
    state: string;
    type: string;
    hold_time: number;
};
export type MplsL2vc = {
    id: number;
    interface: Interface;
    destination: string;
    vc_id: number;
    session_state: string;
    local_label: number;
    remote_label: number;
};
export type VpnInstance = { id: number; name: string; rd?: string; address_family: string; };

export type Device = {
    id: number;
    hostname: string;
    model: string;
    folder_name: string;
    interfaces?: Interface[];
    bgpPeers?: BgpPeer[];
    ospfInterfaceDetails?: OspfDetail[];
    hardwareComponents?: HardwareComponent[];
    cpuSummaries?: CpuSummary[];
    storageSummaries?: StorageSummary[];
    licenseInfos?: LicenseInfo[];
    patchInfos?: PatchInfo[];
    stpConfigurations?: StpConfiguration[];
    arpRecords?: ARPRecord[];
    bfdSessions?: BfdSession[];
    ipRoutes?: IpRoute[];
    isisPeers?: IsisPeer[];
    mplsL2vcs?: MplsL2vc[];
    vpnInstances?: VpnInstance[];
};

export async function getDevices(): Promise<APIResult<Device[]>> {
    if (window.electronAPI) {
        return window.electronAPI.getDevices();
    }
    console.warn("electronAPI not found. Using mock metrics.");
    return Promise.resolve({success: true, data: []});
}

export async function getDeviceDetailsForSummary(deviceId: number, snapshotId: number): Promise<APIResult<Partial<Device>>> {
    return window.electronAPI.getDeviceDetailsForSummary(deviceId, snapshotId);
}

export async function getInterfacesForDevice(deviceId: number, snapshotId: number): Promise<APIResult<Interface[]>> {
    return window.electronAPI.getInterfacesForDevice(deviceId, snapshotId);
}

export async function getRoutingForDevice(deviceId: number, snapshotId: number): Promise<APIResult<{
    ipRoutes: IpRoute[],
    arpRecords: ARPRecord[]
}>> {
    return window.electronAPI.getRoutingForDevice(deviceId, snapshotId);
}

export async function getProtocolsForDevice(deviceId: number, snapshotId: number): Promise<APIResult<{
    bgpPeers: BgpPeer[],
    ospfDetails: OspfDetail[],
    isisPeers: IsisPeer[],
    bfdSessions: BfdSession[]
}>> {
    return window.electronAPI.getProtocolsForDevice(deviceId, snapshotId);
}

export async function getHardwareForDevice(deviceId: number, snapshotId: number): Promise<APIResult<HardwareComponent[]>> {
    return window.electronAPI.getHardwareForDevice(deviceId, snapshotId);
}

export async function getVpnForDevice(deviceId: number, snapshotId: number): Promise<APIResult<{
    mplsL2vcs: MplsL2vc[],
    vpnInstances: VpnInstance[]
}>> {
    return window.electronAPI.getVpnForDevice(deviceId, snapshotId);
}
