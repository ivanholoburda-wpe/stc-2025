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
    Device,
    Interface,
    IpRoute,
    ARPRecord,
    BgpPeer,
    OspfDetail,
    IsisPeer,
    BfdSession,
    HardwareComponent,
    MplsL2vc,
    VpnInstance,
    Vlan,
    EthTrunk,
    PortVlan,
    VxlanTunnel,
    ETrunk
} from '../../api/devices';
import {getSnapshots, Snapshot} from '../../api/snapshot';
import {
    DEVICE_TABS,
    DeviceTab,
    TabButton,
    LoadingSpinner,
    ErrorDisplay,
    NoDataDisplay,
    SummaryTab,
    HardwareTab,
    PortsTab,
    RoutingTab,
    ProtocolsTab,
    VpnTab,
    VlansTab,
    EthTrunksTab,
    ETrunksTab
} from './deviceShared';

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
    const [activeTab, setActiveTab] = useState<DeviceTab>('Summary');
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
                            if (result.success) {
                                console.log('Hardware data loaded:', result.data);
                                console.log('Hardware count:', result.data?.length);
                                if (result.data && result.data.length > 0) {
                                    console.log('First hardware component:', result.data[0]);
                                }
                                setHardware(result.data || []);
                            } else {
                                console.error('Failed to load hardware:', result.error);
                                setError(result.error);
                            }
                        }
                        break;
                    case 'VPN / Tunnels':
                        if (vpn === null) {
                            result = await getVpnForDevice(selectedDeviceId, selectedSnapshotId);
                            if (result.success) {
                                const vpnData = result.data ?? {
                                    mplsL2vcs: [],
                                    vpnInstances: [],
                                    vxlanTunnels: [],
                                };
                                setVpn(vpnData);
                            } else setError(result.error);
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

    const renderActiveTab = () => {
        if (loading.initial) return <LoadingSpinner/>;
        if (error) return <ErrorDisplay error={error}/>;
        if (loading.tab) return <LoadingSpinner/>;

        const noDataMsg = "Немає даних для відображення.";

        switch (activeTab) {
            case 'Summary':
                return summaryDetails ? <SummaryTab device={summaryDetails}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'Hardware':
                if (hardware === null) {
                    return <NoDataDisplay message="Завантаження даних..."/>;
                }
                return <HardwareTab components={hardware}/>;
            case 'Ports':
                return interfaces ? <PortsTab interfaces={interfaces}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'Routing':
                return routing ? <RoutingTab data={routing}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'Protocols':
                return protocols ? <ProtocolsTab data={protocols}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'VPN / Tunnels':
                return vpn ? <VpnTab data={vpn}/> : <NoDataDisplay message={noDataMsg}/>;
            case 'VLANs':
                return (vlans || portVlans) ? <VlansTab vlans={vlans} portVlans={portVlans}/> : <NoDataDisplay message={noDataMsg}/>;
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
                <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                    {loading.initial ? <div className="text-center text-gray-500 p-4">Loading devices...</div> :
                        filteredDevices.map(device => (
                            <button key={device.id} onClick={() => setSelectedDeviceId(device.id)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedDeviceId === device.id ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
                                <div className="font-semibold">{device.folder_name}</div>
                                <div className="text-xs text-gray-400">{device.model}</div>
                            </button>
                        ))
                    }
                </div>
            </div>
            <div className="flex-1 bg-gray-800 rounded-xl flex flex-col">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {DEVICE_TABS.map((tab) => (
                            <TabButton
                                key={tab}
                                label={tab}
                                active={activeTab === tab}
                                onClick={() => setActiveTab(tab)}
                            />
                        ))}
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
                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">{renderActiveTab()}</div>
            </div>
        </div>
    );
}

