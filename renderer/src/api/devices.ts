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
    // Inventory information for main boards
    inventory_boardtype?: string;
    inventory_barcode?: string;
    inventory_item?: string;
    inventory_description?: string;
    inventory_manufactured?: string;
    inventory_vendorname?: string;
    inventory_issuenumber?: string;
    inventory_cleicode?: string;
    inventory_bom?: string;
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
    flags?: string;
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
export type ETrunk = {
    id: number;
    etrunk_id: number;
    state?: string;
    vpn_instance?: string;
    peer_ip?: string;
    source_ip?: string;
    priority?: number;
    system_id?: string;
    peer_system_id?: string;
    peer_priority?: number;
    causation?: string;
    revert_delay_time_s?: number;
    send_period_100ms?: number;
    fail_time_100ms?: number;
    peer_fail_time_100ms?: number;
    receive?: number;
    send?: number;
    recdrop?: number;
    snddrop?: number;
    local_ip?: string;
    interface_name?: string;
    max_active_link_number?: number;
    min_active_link_number?: number;
    work_mode?: string;
    local_phy_state?: string;
    local_state?: string;
    member_count?: number;
    member_type?: string;
    member_id?: number;
    member_remote_id?: string;
    member_state?: string;
    member_causation?: string;
    etrunk_info?: any;
    members?: any[];
};

export type Device = {
    id: number;
    hostname: string;
    model: string;
    folder_name: string;
    // Inventory backplane information
    backplane_boardtype?: string;
    backplane_barcode?: string;
    backplane_item?: string;
    backplane_description?: string;
    backplane_manufactured?: string;
    backplane_vendorname?: string;
    backplane_issuenumber?: string;
    backplane_cleicode?: string;
    backplane_bom?: string;
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
    etrunks?: ETrunk[];
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

export async function getETrunksForDevice(deviceId: number, snapshotId: number): Promise<APIResult<ETrunk[]>> {
    return (window.electronAPI as any).getETrunksForDevice(deviceId, snapshotId);
}
