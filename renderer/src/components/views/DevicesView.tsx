import React, {useState, useEffect, useMemo} from 'react';
import {SearchIcon} from '../../icons';
import {
    getDevices,
    getDeviceDetailsForSummary,
    getInterfacesForDevice,
    getRoutingForDevice,
    getProtocolsForDevice,
    getHardwareForDevice,
    getVpnForDevice,
    getVlansForDevice,
    getEthTrunksForDevice,
    getPortVlansForDevice,
    getETrunksForDevice,
    Device, Interface, IpRoute, ARPRecord, BgpPeer,
    OspfDetail, IsisPeer, BfdSession, HardwareComponent,
    MplsL2vc, VpnInstance, Vlan, EthTrunk, PortVlan, VxlanTunnel, ETrunk
} from '../../api/devices';
import {getSnapshots, Snapshot} from '../../api/snapshot';
import {

} from '../../api/types';

// --- Компоненти-хелпери ---
const StatusIndicator = ({status}: { status?: string }) => {
    if (!status) return <span className="text-gray-500">-</span>;
    const lowerStatus = status.toLowerCase();
    const isGood = lowerStatus.startsWith('up') || lowerStatus.startsWith('estab') || lowerStatus === 'normal' || lowerStatus === 'enable';
    if (isGood) return <span
        className={`px-2 py-0.5 text-xs font-semibold rounded-full bg-green-500/20 text-green-300`}>{status}</span>;
    return <span
        className={`px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-300`}>{status}</span>;
};
const TabButton = ({label, active, onClick}: { label: string, active: boolean, onClick: () => void }) => (
    <button onClick={onClick}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{label}</button>);
const InfoCard = ({title, children}: { title: string, children: React.ReactNode }) => (
    <div><h3 className="text-lg font-semibold mb-3 text-gray-300">{title}</h3>
        <div className="p-4 rounded-lg bg-gray-900/50 space-y-3 text-sm">{children}</div>
    </div>);
const InfoRow = ({label, value}: { label: string, value: any }) => (
    <div><span className="font-semibold text-gray-400">{label}:</span> <span
        className="font-mono text-gray-200">{value ?? '-'}</span></div>);
const Table = ({headers, children}: { headers: string[], children: React.ReactNode }) => (
    <table className="min-w-full text-sm text-left">
        <thead className="text-xs text-gray-400 uppercase">
        <tr>{headers.map(h => <th key={h} className="py-3 px-4">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-700">{children}</tbody>
    </table>);
const LoadingSpinner = () => <div className="p-6 flex items-center justify-center text-gray-500">Завантаження...</div>;
const ErrorDisplay = ({error}: { error: string }) => <div
    className="p-6 flex items-center justify-center text-red-400">{error}</div>;
const NoDataDisplay = ({message}: { message: string }) => <div
    className="p-6 flex items-center justify-center text-gray-500">{message}</div>;

export function DevicesView() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
    const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);

    const [summaryDetails, setSummaryDetails] = useState<Partial<Device> | null>(null);
    const [interfaces, setInterfaces] = useState<Interface[] | null>(null);
    const [routing, setRouting] = useState<{ ipRoutes: IpRoute[], arpRecords: ARPRecord[] } | null>(null);
    const [protocols, setProtocols] = useState<{
        bgpPeers: BgpPeer[],
        ospfDetails: OspfDetail[],
        isisPeers: IsisPeer[],
        bfdSessions: BfdSession[]
    } | null>(null);
    const [hardware, setHardware] = useState<HardwareComponent[] | null>(null);
    const [vpn, setVpn] = useState<{ mplsL2vcs: MplsL2vc[], vpnInstances: VpnInstance[], vxlanTunnels: VxlanTunnel[] } | null>(null);
    const [vlans, setVlans] = useState<Vlan[] | null>(null);
    const [ethTrunks, setEthTrunks] = useState<EthTrunk[] | null>(null);
    const [portVlans, setPortVlans] = useState<PortVlan[] | null>(null);
    const [etrunks, setEtrunks] = useState<ETrunk[] | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Summary');
    const [loading, setLoading] = useState({initial: true, tab: false});
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(prev => ({...prev, initial: true}));
            try {
                const [devicesResult, snapshotsResult] = await Promise.all([getDevices(), getSnapshots()]);
                if (devicesResult.success && devicesResult.data) {
                    setDevices(devicesResult.data);
                    if (devicesResult.data.length > 0 && !selectedDeviceId) setSelectedDeviceId(devicesResult.data[0].id);
                } else setError(devicesResult.error || 'Failed to load devices');

                if (snapshotsResult.success && snapshotsResult.data) {
                    setSnapshots(snapshotsResult.data);
                    if (snapshotsResult.data.length > 0 && !selectedSnapshotId) setSelectedSnapshotId(snapshotsResult.data[0].id);
                } else setError(snapshotsResult.error || 'Failed to load snapshots');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            } finally {
                setLoading(prev => ({...prev, initial: false}));
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedDeviceId || !selectedSnapshotId) return;
        setInterfaces(null);
        setRouting(null);
        setProtocols(null);
        setHardware(null);
        setVpn(null);
        setVlans(null);
        setEthTrunks(null);
        setPortVlans(null);
        setEtrunks(null);
        setSummaryDetails(null);
        setActiveTab('Summary');

        const fetchBaseDetails = async () => {
            setLoading(prev => ({...prev, tab: true}));
            setError('');
            try {
                const result = await getDeviceDetailsForSummary(selectedDeviceId, selectedSnapshotId);
                if (result.success && result.data) setSummaryDetails(result.data);
                else setError(result.error || 'Failed to load device summary.');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            } finally {
                setLoading(prev => ({...prev, tab: false}));
            }
        };
        fetchBaseDetails();
    }, [selectedDeviceId, selectedSnapshotId]);

    // 3. "Ліниве" завантаження даних для активної вкладки
    useEffect(() => {
        if (!selectedDeviceId || !selectedSnapshotId || !activeTab || activeTab === 'Summary') return;
        const loadTabData = async () => {
            setLoading(prev => ({...prev, tab: true}));
            setError('');
            try {
                let result;
                switch (activeTab) {
                    case 'Ports':
                        if (interfaces === null) {
                            result = await getInterfacesForDevice(selectedDeviceId, selectedSnapshotId);
                            if (result.success) setInterfaces(result.data || []); else setError(result.error);
                        }
                        break;
                    case 'Routing':
                        if (routing === null) {
                            result = await getRoutingForDevice(selectedDeviceId, selectedSnapshotId);
                            if (result.success) setRouting(result.data || {
                                ipRoutes: [],
                                arpRecords: []
                            }); else setError(result.error);
                        }
                        break;
                    case 'Protocols':
                        if (protocols === null) {
                            result = await getProtocolsForDevice(selectedDeviceId, selectedSnapshotId);
                            if (result.success) setProtocols(result.data || {
                                bgpPeers: [],
                                ospfDetails: [],
                                isisPeers: [],
                                bfdSessions: []
                            }); else setError(result.error);
                            console.log(result.data);
                        }
                        break;
                    case 'Hardware':
                        if (hardware === null) {
                            result = await getHardwareForDevice(selectedDeviceId, selectedSnapshotId);
                            if (result.success) setHardware(result.data || []); else setError(result.error);
                        }
                        break;
                    case 'VPN / Tunnels':
                        if (vpn === null) {
                            result = await getVpnForDevice(selectedDeviceId, selectedSnapshotId);
                            if (result.success) setVpn(result.data || {
                                mplsL2vcs: [],
                                vpnInstances: [],
                                vxlanTunnels: []
                            }); else setError(result.error);
                        }
                        break;
                    case 'VLANs':
                        if (vlans === null) {
                            result = await getVlansForDevice(selectedDeviceId, selectedSnapshotId);
                            if (result.success) setVlans(result.data || []); else setError(result.error);
                        }
                        if (portVlans === null) {
                            result = await getPortVlansForDevice(selectedDeviceId, selectedSnapshotId);
                            if (result.success) setPortVlans(result.data || []); else setError(result.error);
                        }
                        break;
                    case 'Eth-Trunks':
                        if (ethTrunks === null) {
                            result = await getEthTrunksForDevice(selectedDeviceId, selectedSnapshotId);
                            if (result.success) setEthTrunks(result.data || []); else setError(result.error);
                        }
                        break;
                    case 'E-Trunks':
                        if (etrunks === null) {
                            result = await getETrunksForDevice(selectedDeviceId, selectedSnapshotId);
                            if (result.success) setEtrunks(result.data || []); else setError(result.error);
                        }
                        break;
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            } finally {
                setLoading(prev => ({...prev, tab: false}));
            }
        };
        loadTabData();
    }, [activeTab, selectedDeviceId, selectedSnapshotId, interfaces, routing, protocols, hardware, vpn]);

    const filteredDevices = useMemo(() => devices.filter(d => d.hostname.toLowerCase().includes(searchTerm.toLowerCase())), [devices, searchTerm]);

    // --- Компоненти для вкладок ---
    const SummaryTab = ({device}: { device: Partial<Device> }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCard title="Device Info"><InfoRow label="Hostname" value={device.hostname}/><InfoRow label="Model"
                                                                                                      value={device.model}/><InfoRow
                label="Folder Name" value={device.folder_name}/></InfoCard>
            {device.cpuSummaries?.[0] && <InfoCard title="CPU Summary"><InfoRow label="Current Usage"
                                                                                value={`${device.cpuSummaries[0].system_cpu_use_rate_percent}%`}/><InfoRow
                label="Max Usage" value={`${device.cpuSummaries[0].max_cpu_usage_percent}%`}/></InfoCard>}
            {device.storageSummaries?.[0] && <InfoCard title="Storage"><InfoRow label="Total"
                                                                                value={`${device.storageSummaries[0].total_mb.toFixed(2)} MB`}/><InfoRow
                label="Free" value={`${device.storageSummaries[0].free_mb.toFixed(2)} MB`}/></InfoCard>}
            {device.licenseInfos?.[0] &&
                <InfoCard title="License"><InfoRow label="Product" value={device.licenseInfos[0].product_name}/><InfoRow
                    label="State" value={device.licenseInfos[0].state}/><InfoRow label="Serial"
                                                                                 value={device.licenseInfos[0].serial_no}/></InfoCard>}
            {device.patchInfos?.[0] && <InfoCard title="Patch"><InfoRow label="Exists"
                                                                        value={String(device.patchInfos[0].patch_exists)}/><InfoRow
                label="Package" value={device.patchInfos[0].package_name}/><InfoRow label="Version"
                                                                                    value={device.patchInfos[0].package_version}/></InfoCard>}
            {device.stpConfigurations?.[0] && <InfoCard title="STP Config"><InfoRow label="Status"
                                                                                    value={device.stpConfigurations[0].protocol_status}/><InfoRow
                label="Standard" value={device.stpConfigurations[0].protocol_standard}/><InfoRow label="Bridge MAC"
                                                                                                 value={device.stpConfigurations[0].mac_address}/></InfoCard>}
        </div>
    );

    const HardwareTab = ({components}: { components: HardwareComponent[] | null }) => {
        const hasHealthData = components?.some(c => c.details && (c.details.cpu_usage_percent !== undefined || c.details.memory_usage_percent !== undefined));
        
        return (
            <div className="space-y-8">
                <InfoCard title="Hardware Components">
                    <Table headers={hasHealthData ? ["Slot", "Type", "Model", "Status", "Role", "CPU %", "Memory %", "Memory Used/Total"] : ["Slot", "Type", "Model", "Status", "Role"]}>
                        {components?.map(comp => {
                            const healthData = comp.details as any;
                            const hasHealth = healthData && (healthData.cpu_usage_percent !== undefined || healthData.memory_usage_percent !== undefined);
                            const memUsed = healthData?.memory_used_mb;
                            const memTotal = healthData?.memory_total_mb;
                            const memDisplay = memUsed && memTotal ? `${memUsed}MB/${memTotal}MB` : '-';
                            
                            return (
                                <tr key={comp.id} className="hover:bg-gray-700/50">
                                    <td className="py-3 px-4 font-mono">{comp.slot}</td>
                                    <td className="py-3 px-4">{comp.type}</td>
                                    <td className="py-3 px-4 font-mono">{comp.model || '-'}</td>
                                    <td className="py-3 px-4"><StatusIndicator status={comp.status}/></td>
                                    <td className="py-3 px-4">{comp.role || '-'}</td>
                                    {hasHealthData && (
                                        <>
                                            <td className="py-3 px-4 text-gray-300">
                                                {healthData?.cpu_usage_percent !== undefined ? `${healthData.cpu_usage_percent}%` : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-gray-300">
                                                {healthData?.memory_usage_percent !== undefined ? `${healthData.memory_usage_percent}%` : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-gray-300 font-mono text-xs">{memDisplay}</td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </Table>
                </InfoCard>
            </div>
        );
    };

    const PortsTab = ({interfaces}: { interfaces: Interface[] | null }) => (
        <InfoCard title="Interfaces & Transceivers">
            <Table
                headers={["Port", "PHY", "Proto", "IP Address", "In Util", "Out Util", "In Errors", "Out Errors", "Rx (dBm)", "Tx (dBm)", "TRX Type", "TRX S/N"]}>
                {interfaces?.map(iface => (<tr key={iface.id} className="hover:bg-gray-700/50">
                    <td className="py-3 px-4 font-mono">{iface.name}</td>
                    <td className="py-3 px-4"><StatusIndicator status={iface.phy_status}/></td>
                    <td className="py-3 px-4"><StatusIndicator status={iface.protocol_status}/></td>
                    <td className="py-3 px-4 font-mono">{iface.ip_address || '-'}</td>
                    <td className="py-3 px-4 text-gray-300">{iface.in_utilization}</td>
                    <td className="py-3 px-4 text-gray-300">{iface.out_utilization}</td>
                    <td className="py-3 px-4 text-gray-300">{iface.in_errors ?? 0}</td>
                    <td className="py-3 px-4 text-gray-300">{iface.out_errors ?? 0}</td>
                    <td className="py-3 px-4 text-gray-400">{iface.transceivers?.[0]?.rx_power?.toFixed(2) ?? '-'}</td>
                    <td className="py-3 px-4 text-gray-400">{iface.transceivers?.[0]?.tx_power?.toFixed(2) ?? '-'}</td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{iface.transceivers?.[0]?.type || '-'}</td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{iface.transceivers?.[0]?.serial_number || '-'}</td>
                </tr>))}
            </Table>
        </InfoCard>
    );

    const RoutingTab = ({data}: { data: { ipRoutes: IpRoute[], arpRecords: ARPRecord[] } | null }) => (
        <div className="space-y-8">
            <InfoCard title="IP Routing Table"><Table
                headers={["Destination/Mask", "Protocol", "NextHop", "Interface", "Status", "Network", "Loc Prf", "MED", "VPN Instance", "Pref", "Cost"]}>{data?.ipRoutes.map(r =>
                <tr key={r.id} className="hover:bg-gray-700/50">
                    <td className="py-2 px-3 font-mono">{r.destination_mask}</td>
                    <td className="py-2 px-3">{r.protocol}</td>
                    <td className="py-2 px-3 font-mono">{r.next_hop}</td>
                    <td className="py-2 px-3 font-mono">{r.interface?.name || '-'}</td>
                    <td className="py-2 px-3 font-mono text-xs">{r.status || '-'}</td>
                    <td className="py-2 px-3 font-mono text-xs">{r.network || '-'}</td>
                    <td className="py-2 px-3">{r.loc_prf ?? '-'}</td>
                    <td className="py-2 px-3">{r.med || '-'}</td>
                    <td className="py-2 px-3 font-mono text-xs">{r.vpn_instance || '-'}</td>
                    <td className="py-2 px-3">{r.preference}</td>
                    <td className="py-2 px-3">{r.cost}</td>
                </tr>)}</Table></InfoCard>
            <InfoCard title="ARP Table"><Table
                headers={["IP Address", "MAC Address", "Type", "Interface", "VLAN"]}>{data?.arpRecords.map(r => <tr
                key={r.id} className="hover:bg-gray-700/50">
                <td className="py-2 px-3 font-mono">{r.ip_address}</td>
                <td className="py-2 px-3 font-mono">{r.mac_address}</td>
                <td className="py-2 px-3">{r.type}</td>
                <td className="py-2 px-3 font-mono">{r.interface}</td>
                <td className="py-2 px-3">{r.vlan}</td>
            </tr>)}</Table></InfoCard>
        </div>
    );

    const ProtocolsTab = ({data}: {
        data: {
            bgpPeers: BgpPeer[],
            ospfDetails: OspfDetail[],
            isisPeers: IsisPeer[],
            bfdSessions: BfdSession[]
        } | null
    }) => (
        <div className="space-y-8">
            <InfoCard title="BGP Peers"><Table
                headers={["Peer IP", "Remote AS", "State", "Address Family", "Version", "Out Queue", "Prefixes", "VPN Instance", "Msg Rcvd", "Msg Sent"]}>{data?.bgpPeers.map(p =>
                <tr key={p.id} className="hover:bg-gray-700/50">
                    <td className="py-2 px-3 font-mono">{p.peer_ip}</td>
                    <td>{p.remote_as}</td>
                    <td><StatusIndicator status={p.state}/></td>
                    <td className="font-mono">{p.address_family}</td>
                    <td>{p.version ?? '-'}</td>
                    <td>{p.out_queue ?? '-'}</td>
                    <td>{p.prefixes_received ?? '-'}</td>
                    <td className="font-mono text-xs">{p.vpn_instance || '-'}</td>
                    <td>{p.msg_rcvd}</td>
                    <td>{p.msg_sent}</td>
                </tr>)}</Table></InfoCard>
            <InfoCard title="OSPF Interfaces"><Table
                headers={["Interface", "Cost", "State", "Type"]}>{data?.ospfDetails.map(o => <tr key={o.id}
                                                                                                 className="hover:bg-gray-700/50">
                <td className="py-2 px-3 font-mono">{o.interface.name}</td>
                <td>{o.cost}</td>
                <td>{o.state}</td>
                <td>{o.type}</td>
            </tr>)}</Table></InfoCard>
            <InfoCard title="IS-IS Peers"><Table
                headers={["Interface", "System ID", "State", "Type", "Hold Time"]}>{data?.isisPeers.map(p => <tr
                key={p.id} className="hover:bg-gray-700/50">
                <td className="py-2 px-3 font-mono">{p.interface.name}</td>
                <td className="font-mono">{p.system_id}</td>
                <td><StatusIndicator status={p.state}/></td>
                <td>{p.type}</td>
                <td>{p.hold_time}</td>
            </tr>)}</Table></InfoCard>
            <InfoCard title="BFD Sessions"><Table
                headers={["Interface", "Peer IP", "State", "Type", "Local Disc."]}>{data?.bfdSessions.map(s => <tr
                key={s.id} className="hover:bg-gray-700/50">
                <td className="py-2 px-3 font-mono">{s.interface.name}</td>
                <td className="font-mono">{s.peer_ip_address}</td>
                <td><StatusIndicator status={s.state}/></td>
                <td>{s.type}</td>
                <td>{s.local_discriminator}</td>
            </tr>)}</Table></InfoCard>
        </div>
    );

    const VpnTab = ({data}: { data: { mplsL2vcs: MplsL2vc[], vpnInstances: VpnInstance[], vxlanTunnels: VxlanTunnel[] } | null }) => (
        <div className="space-y-8">
            <InfoCard title="MPLS L2VCs (Virtual Circuits)"><Table
                headers={["Interface", "Destination", "VC ID", "State", "Local Label", "Remote Label"]}>{data?.mplsL2vcs.map(vc =>
                <tr key={vc.id} className="hover:bg-gray-700/50">
                    <td className="py-2 px-3 font-mono">{vc.interface.name}</td>
                    <td className="font-mono">{vc.destination}</td>
                    <td>{vc.vc_id}</td>
                    <td><StatusIndicator status={vc.session_state}/></td>
                    <td>{vc.local_label}</td>
                    <td>{vc.remote_label}</td>
                </tr>)}</Table></InfoCard>
            <InfoCard title="VPN Instances (VRFs)"><Table
                headers={["Name", "Route Distinguisher (RD)", "Address Family"]}>{data?.vpnInstances.map(v => <tr
                key={v.id} className="hover:bg-gray-700/50">
                <td className="py-2 px-3 font-mono">{v.name}</td>
                <td className="font-mono">{v.rd || '-'}</td>
                <td className="font-mono">{v.address_family}</td>
            </tr>)}</Table></InfoCard>
            <InfoCard title="VXLAN Tunnels"><Table
                headers={["VPN Instance", "Tunnel ID", "Source", "Destination", "State", "Type", "Uptime"]}>{data?.vxlanTunnels.map(t => <tr
                key={t.id} className="hover:bg-gray-700/50">
                <td className="py-2 px-3 font-mono">{t.vpn_instance}</td>
                <td>{t.tunnel_id}</td>
                <td className="font-mono">{t.source}</td>
                <td className="font-mono">{t.destination}</td>
                <td><StatusIndicator status={t.state}/></td>
                <td>{t.type || '-'}</td>
                <td>{t.uptime || '-'}</td>
            </tr>)}</Table></InfoCard>
        </div>
    );

    const VlansTab = ({vlans, portVlans}: { vlans: Vlan[] | null, portVlans: PortVlan[] | null }) => (
        <div className="space-y-8">
            <InfoCard title="VLANs">
                <Table headers={["VID", "Status", "Property", "MAC Learn", "Statistics", "Description"]}>
                    {vlans?.map(v => (
                        <tr key={v.id} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{v.vid}</td>
                            <td><StatusIndicator status={v.status}/></td>
                            <td>{v.property || '-'}</td>
                            <td>{v.mac_learn || '-'}</td>
                            <td>{v.statistics || '-'}</td>
                            <td className="text-gray-400">{v.description || '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="Port-VLAN Mappings">
                <Table headers={["Port Name", "Link Type", "PVID", "VLAN List"]}>
                    {portVlans?.map(pv => (
                        <tr key={pv.id} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{pv.port_name}</td>
                            <td>{pv.link_type || '-'}</td>
                            <td>{pv.pvid ?? '-'}</td>
                            <td className="font-mono text-xs">{pv.vlan_list || '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>
        </div>
    );

    const EthTrunksTab = ({trunks}: { trunks: EthTrunk[] | null }) => (
        <div className="space-y-8">
            <InfoCard title="Ethernet Trunks">
                <Table headers={["Trunk ID", "Mode Type", "Working Mode", "Status", "Up Ports"]}>
                    {trunks?.map(t => (
                        <tr key={t.id} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{t.trunk_id}</td>
                            <td>{t.mode_type || '-'}</td>
                            <td>{t.working_mode || '-'}</td>
                            <td><StatusIndicator status={t.operating_status}/></td>
                            <td>{t.number_of_up_ports ?? '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>
        </div>
    );


    const ETrunksTab = ({etrunks}: { etrunks: ETrunk[] | null }) => (
        <div className="space-y-8">
            <InfoCard title="E-Trunks Overview">
                <Table headers={["E-Trunk ID", "State", "VPN Instance", "Peer IP", "Source IP", "Priority", "Causation"]}>
                    {etrunks?.map(e => (
                        <tr key={e.id} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{e.etrunk_id}</td>
                            <td><StatusIndicator status={e.state}/></td>
                            <td className="font-mono text-xs">{e.vpn_instance || '-'}</td>
                            <td className="font-mono">{e.peer_ip || '-'}</td>
                            <td className="font-mono">{e.source_ip || '-'}</td>
                            <td>{e.priority ?? '-'}</td>
                            <td>{e.causation || '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="System IDs and Priorities">
                <Table headers={["E-Trunk ID", "System ID", "Priority", "Peer System ID", "Peer Priority"]}>
                    {etrunks?.map(e => (
                        <tr key={e.id} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{e.etrunk_id}</td>
                            <td className="font-mono text-xs">{e.system_id || '-'}</td>
                            <td>{e.priority ?? '-'}</td>
                            <td className="font-mono text-xs">{e.peer_system_id || '-'}</td>
                            <td>{e.peer_priority ?? '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="Timing Configuration">
                <Table headers={["E-Trunk ID", "Revert Delay (s)", "Send Period (100ms)", "Fail Time (100ms)", "Peer Fail Time (100ms)"]}>
                    {etrunks?.map(e => (
                        <tr key={e.id} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{e.etrunk_id}</td>
                            <td>{e.revert_delay_time_s ?? '-'}</td>
                            <td>{e.send_period_100ms ?? '-'}</td>
                            <td>{e.fail_time_100ms ?? '-'}</td>
                            <td>{e.peer_fail_time_100ms ?? '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="Statistics">
                <Table headers={["E-Trunk ID", "Receive", "Send", "Rec Drop", "Send Drop"]}>
                    {etrunks?.map(e => (
                        <tr key={e.id} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{e.etrunk_id}</td>
                            <td>{e.receive?.toLocaleString() ?? '-'}</td>
                            <td>{e.send?.toLocaleString() ?? '-'}</td>
                            <td className={e.recdrop && e.recdrop > 0 ? "text-red-400" : ""}>
                                {e.recdrop?.toLocaleString() ?? '-'}
                            </td>
                            <td className={e.snddrop && e.snddrop > 0 ? "text-red-400" : ""}>
                                {e.snddrop?.toLocaleString() ?? '-'}
                            </td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            {etrunks?.some(e => e.members && Array.isArray(e.members) && e.members.length > 0) && (
                <InfoCard title="E-Trunk Members">
                    <div className="space-y-6">
                        {etrunks?.map(e => {
                            if (!e.members || !Array.isArray(e.members) || e.members.length === 0) return null;
                            return (
                                <div key={e.id} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                                    <h4 className="text-lg font-semibold mb-3 text-blue-400">
                                        E-Trunk ID: {e.etrunk_id}
                                    </h4>
                                    <Table headers={["Type", "ID", "Local Phy State", "Work Mode", "State", "Causation", "Remote ID"]}>
                                        {e.members.map((member: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-gray-700/50">
                                                <td className="py-2 px-3">{member.type || '-'}</td>
                                                <td className="font-mono">{member.id ?? '-'}</td>
                                                <td><StatusIndicator status={member.local_phy_state}/></td>
                                                <td>{member.work_mode || '-'}</td>
                                                <td><StatusIndicator status={member.state}/></td>
                                                <td>{member.causation || '-'}</td>
                                                <td className="font-mono">{member.remote_id ?? '-'}</td>
                                            </tr>
                                        ))}
                                    </Table>
                                </div>
                            );
                        })}
                    </div>
                </InfoCard>
            )}
        </div>
    );

    const renderActiveTab = () => {
        if (loading.initial) return <LoadingSpinner/>;
        if (error) return <ErrorDisplay error={error}/>;
        if (loading.tab) return <LoadingSpinner/>;

        const noDataMsg = "Немає даних для відображення.";

        switch (activeTab) {
            case 'Summary':
                return summaryDetails ? <SummaryTab device={summaryDetails}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'Hardware':
                return hardware ? <HardwareTab components={hardware}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'Ports':
                return interfaces ? <PortsTab interfaces={interfaces}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'Routing':
                return routing ? <RoutingTab data={routing}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'Protocols':
                return protocols ? <ProtocolsTab data={protocols}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'VPN / Tunnels':
                return vpn ? <VpnTab data={vpn}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'VLANs':
                return (vlans !== null || portVlans !== null) ? <VlansTab vlans={vlans} portVlans={portVlans}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'Eth-Trunks':
                return ethTrunks ? <EthTrunksTab trunks={ethTrunks}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'E-Trunks':
                return etrunks ? <ETrunksTab etrunks={etrunks}/> : <NoDataDisplay message={noDataMsg}/>;
            default:
                return <div>Not implemented yet.</div>;
        }
    };

    return (
        <div className="flex h-full bg-gray-900 text-white font-sans p-6">
            <div className="w-72 flex-shrink-0 bg-gray-800 rounded-xl flex flex-col mr-6">
                <div className="p-4 border-b border-gray-700">
                    <div className="relative"><SearchIcon
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/><input type="text"
                                                                                                           placeholder="Search device..."
                                                                                                           value={searchTerm}
                                                                                                           onChange={(e) => setSearchTerm(e.target.value)}
                                                                                                           className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-2">
                    {loading.initial ? <div className="text-center text-gray-500 p-4">Loading devices...</div> :
                        filteredDevices.map(device => (
                            <button key={device.id} onClick={() => setSelectedDeviceId(device.id)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedDeviceId === device.id ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                                <div className="font-semibold">{device.hostname}</div>
                                <div className="text-xs text-gray-400">{device.model}</div>
                            </button>
                        ))
                    }
                </div>
            </div>
            <div className="flex-1 bg-gray-800 rounded-xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <TabButton label="Summary" active={activeTab === 'Summary'}
                                   onClick={() => setActiveTab('Summary')}/>
                        <TabButton label="Hardware" active={activeTab === 'Hardware'}
                                   onClick={() => setActiveTab('Hardware')}/>
                        <TabButton label="Ports" active={activeTab === 'Ports'} onClick={() => setActiveTab('Ports')}/>
                        <TabButton label="Routing" active={activeTab === 'Routing'}
                                   onClick={() => setActiveTab('Routing')}/>
                        <TabButton label="Protocols" active={activeTab === 'Protocols'}
                                   onClick={() => setActiveTab('Protocols')}/>
                        <TabButton label="VPN / Tunnels" active={activeTab === 'VPN / Tunnels'}
                                   onClick={() => setActiveTab('VPN / Tunnels')}/>
                        <TabButton label="VLANs" active={activeTab === 'VLANs'}
                                   onClick={() => setActiveTab('VLANs')}/>
                        <TabButton label="Eth-Trunks" active={activeTab === 'Eth-Trunks'}
                                   onClick={() => setActiveTab('Eth-Trunks')}/>
                        <TabButton label="E-Trunks" active={activeTab === 'E-Trunks'}
                                   onClick={() => setActiveTab('E-Trunks')}/>
                    </div>
                    <div>
                        <select
                            value={selectedSnapshotId || ''}
                            onChange={(e) => setSelectedSnapshotId(Number(e.target.value))}
                            className="bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading.initial}
                        >
                            {snapshots.map(snap => (
                                <option key={snap.id} value={snap.id}>Snapshot
                                    #{snap.id} - {new Date(snap.created_at).toLocaleDateString()}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-4">{renderActiveTab()}</div>
            </div>
        </div>
    );
}

