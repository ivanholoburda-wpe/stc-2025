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
    Device, Interface, IpRoute, ARPRecord, BgpPeer,
    OspfDetail, IsisPeer, BfdSession, HardwareComponent,
    MplsL2vc, VpnInstance
} from '../../api/devices';
import {getSnapshots, Snapshot} from '../../api/snapshot';
import {

} from '../../api/types';

// --- Компоненти-хелпери ---
const StatusIndicator = ({status}: { status?: string }) => {
    if (!status) return <span className="text-gray-500">-</span>;
    const lowerStatus = status.toLowerCase();
    const isGood = lowerStatus.startsWith('up') || lowerStatus.startsWith('estab') || lowerStatus === 'normal';
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
    const [vpn, setVpn] = useState<{ mplsL2vcs: MplsL2vc[], vpnInstances: VpnInstance[] } | null>(null);

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
                                vpnInstances: []
                            }); else setError(result.error);
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

    const HardwareTab = ({components}: { components: HardwareComponent[] | null }) => (
        <InfoCard title="Hardware Components">
            <Table headers={["Slot", "Type", "Model", "Status", "Role"]}>
                {components?.map(comp => (<tr key={comp.id} className="hover:bg-gray-700/50">
                    <td className="py-3 px-4">{comp.slot}</td>
                    <td className="py-3 px-4 font-mono">{comp.type}</td>
                    <td className="py-3 px-4 font-mono">{comp.model}</td>
                    <td className="py-3 px-4"><StatusIndicator status={comp.status}/></td>
                    <td className="py-3 px-4">{comp.role}</td>
                </tr>))}
            </Table>
        </InfoCard>
    );

    const PortsTab = ({interfaces}: { interfaces: Interface[] | null }) => (
        <InfoCard title="Interfaces & Transceivers">
            <Table
                headers={["Port", "PHY", "Proto", "IP Address", "Description", "Rx (dBm)", "Tx (dBm)", "TRX Type", "TRX S/N"]}>
                {interfaces?.map(iface => (<tr key={iface.id} className="hover:bg-gray-700/50">
                    <td className="py-3 px-4 font-mono">{iface.name}</td>
                    <td className="py-3 px-4"><StatusIndicator status={iface.phy_status}/></td>
                    <td className="py-3 px-4"><StatusIndicator status={iface.protocol_status}/></td>
                    <td className="py-3 px-4 font-mono">{iface.ip_address || '-'}</td>
                    <td className="py-3 px-4 text-gray-400">{iface.description || '-'}</td>
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
                headers={["Destination/Mask", "Protocol", "NextHop", "Interface", "Pref", "Cost"]}>{data?.ipRoutes.map(r =>
                <tr key={r.id} className="hover:bg-gray-700/50">
                    <td className="py-2 px-3 font-mono">{r.destination_mask}</td>
                    <td className="py-2 px-3">{r.protocol}</td>
                    <td className="py-2 px-3 font-mono">{r.next_hop}</td>
                    <td className="py-2 px-3 font-mono">{r.interface?.name || '-'}</td>
                    <td className="py-2 px-3">{r.preference}</td>
                    <td className="py-2 px-3">{r.cost}</td>
                </tr>)}</Table></InfoCard>
            <InfoCard title="ARP Table"><Table
                headers={["IP Address", "MAC Address", "Type", "Interface", "VLAN"]}>{data?.arpRecords.map(r => <tr
                key={r.id} className="hover:bg-gray-700/50">
                <td className="py-2 px-3 font-mono">{r.ip_address}</td>
                <td className="py-2 px-3 font-mono">{r.mac_address}</td>
                <td className="py-2 px-3">{r.type}</td>
                <td className="py-2 px-3 font-mono">{r.interface?.name}</td>
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
                headers={["Peer IP", "Remote AS", "State", "Address Family", "Msg Rcvd", "Msg Sent"]}>{data?.bgpPeers.map(p =>
                <tr key={p.id} className="hover:bg-gray-700/50">
                    <td className="py-2 px-3 font-mono">{p.peer_ip}</td>
                    <td>{p.remote_as}</td>
                    <td><StatusIndicator status={p.state}/></td>
                    <td className="font-mono">{p.address_family}</td>
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

    const VpnTab = ({data}: { data: { mplsL2vcs: MplsL2vc[], vpnInstances: VpnInstance[] } | null }) => (
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
                <td className="font-mono">{v.rd}</td>
                <td className="font-mono">{v.address_family}</td>
            </tr>)}</Table></InfoCard>
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
                    <div className="flex items-center gap-2">
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

