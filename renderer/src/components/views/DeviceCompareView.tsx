import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    getDevices,
    getDeviceDetailsForSummary,
    getInterfacesForDevice,
    getRoutingForDevice,
    getProtocolsForDevice,
    getHardwareForDevice,
    getVpnForDevice,
    getVlansForDevice,
    getPortVlansForDevice,
    getEthTrunksForDevice,
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
    PortVlan,
    EthTrunk,
    VxlanTunnel,
    ETrunk,
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
    ETrunksTab,
} from './deviceShared';
import {DiffViewer} from '../DiffViewer';

interface RoutingData {
    ipRoutes: IpRoute[];
    arpRecords: ARPRecord[];
}

interface ProtocolsData {
    bgpPeers: BgpPeer[];
    ospfDetails: OspfDetail[];
    isisPeers: IsisPeer[];
    bfdSessions: BfdSession[];
}

interface VpnData {
    mplsL2vcs: MplsL2vc[];
    vpnInstances: VpnInstance[];
    vxlanTunnels: VxlanTunnel[];
}

const normalizeVpnData = (data?: {
    mplsL2vcs?: MplsL2vc[];
    vpnInstances?: VpnInstance[];
    vxlanTunnels?: VxlanTunnel[];
} | null): VpnData => ({
    mplsL2vcs: data?.mplsL2vcs ?? [],
    vpnInstances: data?.vpnInstances ?? [],
    vxlanTunnels: data?.vxlanTunnels ?? [],
});

interface DeviceDataState {
    summary: Partial<Device> | null;
    interfaces: Interface[] | null;
    routing: RoutingData | null;
    protocols: ProtocolsData | null;
    hardware: HardwareComponent[] | null;
    vpn: VpnData | null;
    vlans: Vlan[] | null;
    portVlans: PortVlan[] | null;
    ethTrunks: EthTrunk[] | null;
    etrunks: ETrunk[] | null;
    loading: { initial: boolean; tab: boolean };
    error: string;
    loadTabData: (tab: DeviceTab) => Promise<void>;
}

function useDeviceData(deviceId: number | null, snapshotId: number | null): DeviceDataState {
    const [summary, setSummary] = useState<Partial<Device> | null>(null);
    const [interfaces, setInterfaces] = useState<Interface[] | null>(null);
    const [routing, setRouting] = useState<RoutingData | null>(null);
    const [protocols, setProtocols] = useState<ProtocolsData | null>(null);
    const [hardware, setHardware] = useState<HardwareComponent[] | null>(null);
    const [vpn, setVpn] = useState<VpnData | null>(null);
    const [vlans, setVlans] = useState<Vlan[] | null>(null);
    const [portVlans, setPortVlans] = useState<PortVlan[] | null>(null);
    const [ethTrunks, setEthTrunks] = useState<EthTrunk[] | null>(null);
    const [etrunks, setEtrunks] = useState<ETrunk[] | null>(null);
    const [loading, setLoading] = useState({initial: false, tab: false});
    const [error, setError] = useState('');

    const loadedTabsRef = useRef<Set<DeviceTab>>(new Set());
    const selectionRef = useRef<{deviceId: number | null; snapshotId: number | null}>({deviceId: null, snapshotId: null});

    useEffect(() => {
        selectionRef.current = {deviceId, snapshotId};
        setSummary(null);
        setInterfaces(null);
        setRouting(null);
        setProtocols(null);
        setHardware(null);
        setVpn(null);
        setVlans(null);
        setPortVlans(null);
        setEthTrunks(null);
        setEtrunks(null);
        setError('');
        loadedTabsRef.current = new Set();

        if (!deviceId || !snapshotId) {
            setLoading({initial: false, tab: false});
            return;
        }

        let cancelled = false;
        setLoading({initial: true, tab: false});

        const fetchSummary = async () => {
            try {
                const result = await getDeviceDetailsForSummary(deviceId, snapshotId);
                if (cancelled) return;
                if (selectionRef.current.deviceId !== deviceId || selectionRef.current.snapshotId !== snapshotId) return;

                if (result.success && result.data) {
                    setSummary(result.data);
                } else {
                    setError(result.error || 'Failed to load device data.');
                }
            } catch (err) {
                if (cancelled) return;
                if (selectionRef.current.deviceId !== deviceId || selectionRef.current.snapshotId !== snapshotId) return;
                setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            } finally {
                if (!cancelled && selectionRef.current.deviceId === deviceId && selectionRef.current.snapshotId === snapshotId) {
                    setLoading(prev => ({...prev, initial: false}));
                }
            }
        };

        fetchSummary();

        return () => {
            cancelled = true;
        };
    }, [deviceId, snapshotId]);

    const loadTabData = useCallback(
        async (tab: DeviceTab) => {
            if (!deviceId || !snapshotId) return;
            if (tab === 'Summary' || loadedTabsRef.current.has(tab)) return;

            const isCurrent = () =>
                selectionRef.current.deviceId === deviceId && selectionRef.current.snapshotId === snapshotId;

            setLoading(prev => ({...prev, tab: true}));
            setError('');

            try {
                switch (tab) {
                    case 'Ports': {
                        const result = await getInterfacesForDevice(deviceId, snapshotId);
                        if (!result.success) throw new Error(result.error || 'Failed to load ports.');
                        if (!isCurrent()) return;
                        setInterfaces(result.data || []);
                        break;
                    }
                    case 'Routing': {
                        const result = await getRoutingForDevice(deviceId, snapshotId);
                        if (!result.success) throw new Error(result.error || 'Failed to load routing.');
                        if (!isCurrent()) return;
                        setRouting(result.data || {ipRoutes: [], arpRecords: []});
                        break;
                    }
                    case 'Protocols': {
                        const result = await getProtocolsForDevice(deviceId, snapshotId);
                        if (!result.success) throw new Error(result.error || 'Failed to load protocols.');
                        if (!isCurrent()) return;
                        setProtocols(
                            result.data || {
                                bgpPeers: [],
                                ospfDetails: [],
                                isisPeers: [],
                                bfdSessions: [],
                            },
                        );
                        break;
                    }
                    case 'Hardware': {
                        const result = await getHardwareForDevice(deviceId, snapshotId);
                        if (!result.success) throw new Error(result.error || 'Failed to load hardware data.');
                        if (!isCurrent()) return;
                        setHardware(result.data || []);
                        break;
                    }
                    case 'VPN / Tunnels': {
                        const result = await getVpnForDevice(deviceId, snapshotId);
                        if (!result.success) throw new Error(result.error || 'Failed to load VPN data.');
                        if (!isCurrent()) return;
                        setVpn(normalizeVpnData(result.data));
                        break;
                    }
                    case 'VLANs': {
                        const vlansResult = await getVlansForDevice(deviceId, snapshotId);
                        if (!vlansResult.success) throw new Error(vlansResult.error || 'Failed to load VLANs.');
                        if (!isCurrent()) return;
                        setVlans(vlansResult.data || []);

                        const portVlansResult = await getPortVlansForDevice(deviceId, snapshotId);
                        if (!portVlansResult.success) throw new Error(portVlansResult.error || 'Failed to load port VLANs.');
                        if (!isCurrent()) return;
                        setPortVlans(portVlansResult.data || []);
                        break;
                    }
                    case 'Eth-Trunks': {
                        const result = await getEthTrunksForDevice(deviceId, snapshotId);
                        if (!result.success) throw new Error(result.error || 'Failed to load Eth-Trunk.');
                        if (!isCurrent()) return;
                        setEthTrunks(result.data || []);
                        break;
                    }
                    case 'E-Trunks': {
                        const result = await getETrunksForDevice(deviceId, snapshotId);
                        if (!result.success) throw new Error(result.error || 'Failed to load E-Trunk.');
                        if (!isCurrent()) return;
                        setEtrunks(result.data || []);
                        break;
                    }
                    default:
                        break;
                }

                if (isCurrent()) {
                    loadedTabsRef.current.add(tab);
                }
            } catch (err) {
                if (isCurrent()) {
                    setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
                }
            } finally {
                if (isCurrent()) {
                    setLoading(prev => ({...prev, tab: false}));
                }
            }
        },
        [deviceId, snapshotId],
    );

    return {
        summary,
        interfaces,
        routing,
        protocols,
        hardware,
        vpn,
        vlans,
        portVlans,
        ethTrunks,
        etrunks,
        loading,
        error,
        loadTabData,
    };
}

interface DevicePanelProps {
    title: string;
    devices: Device[];
    snapshots: Snapshot[];
    selectedDeviceId: number | null;
    selectedSnapshotId: number | null;
    onDeviceChange: (deviceId: number | null) => void;
    onSnapshotChange: (snapshotId: number | null) => void;
    data: DeviceDataState;
    activeTab: DeviceTab;
}

const DevicePanel: React.FC<DevicePanelProps> = ({
                                                     title,
                                                     devices,
                                                     snapshots,
                                                     selectedDeviceId,
                                                     selectedSnapshotId,
                                                     onDeviceChange,
                                                     onSnapshotChange,
                                                     data,
                                                     activeTab,
                                                 }) => {
    const handleDeviceSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        onDeviceChange(value ? Number(value) : null);
    };

    const handleSnapshotSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        onSnapshotChange(value ? Number(value) : null);
    };

    const renderTabContent = () => {
        if (!selectedDeviceId || !selectedSnapshotId) {
            return <NoDataDisplay message="Select a device and snapshot to view." />;
        }

        if (data.loading.initial) {
            return <LoadingSpinner />;
        }

        if (data.error) {
            return <ErrorDisplay error={data.error} />;
        }

        if (data.loading.tab) {
            return <LoadingSpinner />;
        }

        const noDataMsg = 'No data to display.';

        switch (activeTab) {
            case 'Summary':
                return data.summary ? <SummaryTab device={data.summary} /> : <NoDataDisplay message={noDataMsg} />;
            case 'Hardware':
                if (data.hardware === null) return <NoDataDisplay message="Loading data..." />;
                return <HardwareTab components={data.hardware} />;
            case 'Ports':
                return data.interfaces ? <PortsTab interfaces={data.interfaces} /> : <NoDataDisplay message={noDataMsg} />;
            case 'Routing':
                return data.routing ? <RoutingTab data={data.routing} /> : <NoDataDisplay message={noDataMsg} />;
            case 'Protocols':
                return data.protocols ? <ProtocolsTab data={data.protocols} /> : <NoDataDisplay message={noDataMsg} />;
            case 'VPN / Tunnels':
                return data.vpn ? <VpnTab data={data.vpn} /> : <NoDataDisplay message={noDataMsg} />;
            case 'VLANs':
                return data.vlans || data.portVlans ? (
                    <VlansTab vlans={data.vlans} portVlans={data.portVlans} />
                ) : (
                    <NoDataDisplay message={noDataMsg} />
                );
            case 'Eth-Trunks':
                return data.ethTrunks ? <EthTrunksTab trunks={data.ethTrunks} /> : <NoDataDisplay message={noDataMsg} />;
            case 'E-Trunks':
                return data.etrunks ? <ETrunksTab etrunks={data.etrunks} /> : <NoDataDisplay message={noDataMsg} />;
            default:
                return <NoDataDisplay message={noDataMsg} />;
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <p className="text-xs text-gray-400">Compare the same tabs for the selected devices.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Device</label>
                        <select
                            value={selectedDeviceId ?? ''}
                            onChange={handleDeviceSelect}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={devices.length === 0}
                        >
                            <option value="" disabled>
                                Select a device
                            </option>
                            {devices.map(device => (
                                <option key={device.id} value={device.id}>
                                    {device.hostname}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Snapshot</label>
                        <select
                            value={selectedSnapshotId ?? ''}
                            onChange={handleSnapshotSelect}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={snapshots.length === 0}
                        >
                            <option value="" disabled>
                                Select a snapshot
                            </option>
                            {snapshots.map(snapshot => (
                                <option key={snapshot.id} value={snapshot.id}>
                                    Snapshot #{snapshot.id} — {new Date(snapshot.created_at).toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <div className="bg-gray-900/60 rounded-lg p-4 min-h-[260px] flex">
                <div className="w-full">{renderTabContent()}</div>
            </div>
        </div>
    );
};

export function DeviceCompareView() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [leftDeviceId, setLeftDeviceId] = useState<number | null>(null);
    const [rightDeviceId, setRightDeviceId] = useState<number | null>(null);
    const [leftSnapshotId, setLeftSnapshotId] = useState<number | null>(null);
    const [rightSnapshotId, setRightSnapshotId] = useState<number | null>(null);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState('');
    const [activeTab, setActiveTab] = useState<DeviceTab>('Summary');
    const [showDiff, setShowDiff] = useState(false);
    const [highlightDiff, setHighlightDiff] = useState(true);

    useEffect(() => {
        const loadLists = async () => {
            setListLoading(true);
            setListError('');
            try {
                const [devicesResult, snapshotsResult] = await Promise.all([getDevices(), getSnapshots()]);

                if (devicesResult.success && devicesResult.data) {
                    setDevices(devicesResult.data);
                    setLeftDeviceId(prev => prev ?? (devicesResult.data[0]?.id ?? null));
                    setRightDeviceId(prev => {
                        if (prev !== null) return prev;
                        if (devicesResult.data.length > 1) return devicesResult.data[1].id;
                        return devicesResult.data[0]?.id ?? null;
                    });
                } else {
                    setListError(prev => prev || devicesResult.error || 'Failed to load device list.');
                }

                if (snapshotsResult.success && snapshotsResult.data) {
                    setSnapshots(snapshotsResult.data);
                    setLeftSnapshotId(prev => prev ?? (snapshotsResult.data[0]?.id ?? null));
                    setRightSnapshotId(prev => prev ?? (snapshotsResult.data[0]?.id ?? null));
                } else {
                    setListError(prev => prev || snapshotsResult.error || 'Failed to load snapshots.');
                }
            } catch (err) {
                setListError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            } finally {
                setListLoading(false);
            }
        };

        loadLists();
    }, []);

    const leftData = useDeviceData(leftDeviceId, leftSnapshotId);
    const rightData = useDeviceData(rightDeviceId, rightSnapshotId);

    useEffect(() => {
        if (activeTab === 'Summary') return;
        leftData.loadTabData(activeTab);
        rightData.loadTabData(activeTab);
    }, [activeTab, leftData.loadTabData, rightData.loadTabData]);

    const showNoDevices = useMemo(() => !listLoading && devices.length === 0, [listLoading, devices.length]);

    const getDataForComparison = useCallback((data: DeviceDataState, tab: DeviceTab): any => {
        switch (tab) {
            case 'Summary':
                return data.summary;
            case 'Hardware':
                return data.hardware;
            case 'Ports':
                return data.interfaces;
            case 'Routing':
                return data.routing;
            case 'Protocols':
                return data.protocols;
            case 'VPN / Tunnels':
                return data.vpn;
            case 'VLANs':
                return {vlans: data.vlans, portVlans: data.portVlans};
            case 'Eth-Trunks':
                return data.ethTrunks;
            case 'E-Trunks':
                return data.etrunks;
            default:
                return null;
        }
    }, []);

    const leftCompareData = useMemo(() => getDataForComparison(leftData, activeTab), [leftData, activeTab, getDataForComparison]);
    const rightCompareData = useMemo(() => getDataForComparison(rightData, activeTab), [rightData, activeTab, getDataForComparison]);

    if (listLoading) {
        return (
            <div className="p-6 text-gray-100">
                <LoadingSpinner />
            </div>
        );
    }

    if (showNoDevices) {
        return (
            <div className="p-6 text-gray-100 space-y-4">
                {listError ? <ErrorDisplay error={listError} /> : null}
                <NoDataDisplay message="No devices found. Add at least one device to compare." />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 text-gray-100">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Device comparison</h1>
                    <p className="text-sm text-gray-400">
                        Choose two devices and analyze their characteristics side by side with synchronized tabs.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {DEVICE_TABS.map(tab => (
                        <TabButton key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
                    ))}
                </div>
            </div>

            {listError && !showNoDevices ? <ErrorDisplay error={listError} /> : null}

            {leftCompareData !== null && rightCompareData !== null && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowDiff(!showDiff)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            showDiff
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {showDiff ? 'Hide Diff' : 'Show Diff'}
                    </button>
                </div>
            )}

            {showDiff && leftCompareData !== null && rightCompareData !== null && (
                <DiffViewer
                    left={leftCompareData}
                    right={rightCompareData}
                    showDiff={showDiff}
                    highlightDiff={highlightDiff}
                    onToggleHighlight={() => setHighlightDiff(!highlightDiff)}
                />
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <DevicePanel
                    title="Device A"
                    devices={devices}
                    snapshots={snapshots}
                    selectedDeviceId={leftDeviceId}
                    selectedSnapshotId={leftSnapshotId}
                    onDeviceChange={setLeftDeviceId}
                    onSnapshotChange={setLeftSnapshotId}
                    data={leftData}
                    activeTab={activeTab}
                />
                <DevicePanel
                    title="Device B"
                    devices={devices}
                    snapshots={snapshots}
                    selectedDeviceId={rightDeviceId}
                    selectedSnapshotId={rightSnapshotId}
                    onDeviceChange={setRightDeviceId}
                    onSnapshotChange={setRightSnapshotId}
                    data={rightData}
                    activeTab={activeTab}
                />
            </div>
        </div>
    );
}