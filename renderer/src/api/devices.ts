import {APIResult} from "./types";

export type Interface = {
    id: number;
    name: string;
    phy_status?: string;
    protocol_status?: string;
    ip_address?: string;
    description?: string;
    mtu?: number;
    in_utilization?: string;
    out_utilization?: string;
    in_errors?: number;
    out_errors?: number;
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
    version?: number;
    out_queue?: number;
    prefixes_received?: number;
    vpn_instance?: string;
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
    interface?: string;
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
    status?: string;
    network?: string;
    prefix_len?: number;
    loc_prf?: number;
    med?: string;
    pref_val?: number;
    path_ogn?: string;
    label?: number;
    route_distinguisher?: string;
    vpn_instance?: string;
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
export type Vlan = {
    id: number;
    vid: number;
    status?: string;
    property?: string;
    mac_learn?: string;
    statistics?: string;
    description?: string;
};
export type EthTrunk = {
    id: number;
    trunk_id: number;
    mode_type?: string;
    working_mode?: string;
    operating_status?: string;
    number_of_up_ports?: number;
    local_info?: any;
    ports_info?: any;
};
export type PortVlan = {
    id: number;
    port_name: string;
    link_type?: string;
    pvid?: number;
    vlan_list?: string;
    interface?: Interface | null;
};
export type VxlanTunnel = {
    id: number;
    vpn_instance: string;
    tunnel_id: number;
    source: string;
    destination: string;
    state?: string;
    type?: string;
    uptime?: string;
};

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
    vlans?: Vlan[];
    ethTrunks?: EthTrunk[];
    portVlans?: PortVlan[];
    vxlanTunnels?: VxlanTunnel[];
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
    vpnInstances: VpnInstance[],
    vxlanTunnels?: VxlanTunnel[]
}>> {
    const result = await window.electronAPI.getVpnForDevice(deviceId, snapshotId);
    if (result.success && result.data) {
        const data = result.data as any;
        return {
            ...result,
            data: {
                mplsL2vcs: data.mplsL2vcs || [],
                vpnInstances: data.vpnInstances || [],
                vxlanTunnels: data.vxlanTunnels || []
            }
        };
    }
    return result;
}

export async function getVlansForDevice(deviceId: number, snapshotId: number): Promise<APIResult<Vlan[]>> {
    return (window.electronAPI as any).getVlansForDevice(deviceId, snapshotId);
}

export async function getEthTrunksForDevice(deviceId: number, snapshotId: number): Promise<APIResult<EthTrunk[]>> {
    return (window.electronAPI as any).getEthTrunksForDevice(deviceId, snapshotId);
}

export async function getPortVlansForDevice(deviceId: number, snapshotId: number): Promise<APIResult<PortVlan[]>> {
    return (window.electronAPI as any).getPortVlansForDevice(deviceId, snapshotId);
}
