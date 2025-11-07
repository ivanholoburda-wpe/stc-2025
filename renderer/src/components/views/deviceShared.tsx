import React from 'react';
import {
    ARPRecord,
    BfdSession,
    BgpPeer,
    Device,
    ETrunk,
    EthTrunk,
    HardwareComponent,
    Interface,
    IpRoute,
    IsisPeer,
    MplsL2vc,
    PortVlan,
    Vlan,
    VpnInstance,
    VxlanTunnel,
    OspfDetail,
} from '../../api/devices';

export type DeviceTab =
    | 'Summary'
    | 'Hardware'
    | 'Ports'
    | 'Routing'
    | 'Protocols'
    | 'VPN / Tunnels'
    | 'VLANs'
    | 'Eth-Trunks'
    | 'E-Trunks';

export const DEVICE_TABS: DeviceTab[] = [
    'Summary',
    'Hardware',
    'Ports',
    'Routing',
    'Protocols',
    'VPN / Tunnels',
    'VLANs',
    'Eth-Trunks',
    'E-Trunks',
];

export const StatusIndicator = ({ status }: { status?: string }) => {
    if (!status) {
        return <span className="text-gray-500">-</span>;
    }

    const lowerStatus = status.toLowerCase();
    const isGood =
        lowerStatus.startsWith('up') ||
        lowerStatus.startsWith('estab') ||
        lowerStatus === 'normal' ||
        lowerStatus === 'enable';

    const baseClasses = 'px-2 py-0.5 text-xs font-semibold rounded-full';
    const goodClasses = 'bg-green-500/20 text-green-300';
    const badClasses = 'bg-red-500/20 text-red-300';

    return (
        <span className={`${baseClasses} ${isGood ? goodClasses : badClasses}`}>
            {status}
        </span>
    );
};

export const TabButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {label}
    </button>
);

export const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-300">{title}</h3>
        <div className="p-4 rounded-lg bg-gray-900/50 space-y-3 text-sm">{children}</div>
    </div>
);

export const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <span className="font-semibold text-gray-400">{label}:</span>{' '}
        <span className="font-mono text-gray-200">{value ?? '-'}</span>
    </div>
);

export const Table = ({ headers, children }: { headers: string[]; children: React.ReactNode }) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(false);

    const updateScrollState = React.useCallback(() => {
        const el = containerRef.current;
        if (!el) {
            setCanScrollLeft(false);
            setCanScrollRight(false);
            return;
        }

        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    const scrollBy = React.useCallback((direction: 'left' | 'right') => {
        const el = containerRef.current;
        if (!el) {
            return;
        }

        const amount = el.clientWidth * 0.6 || 200;
        el.scrollBy({
            left: direction === 'left' ? -amount : amount,
            behavior: 'smooth',
        });
    }, []);

    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) {
            return;
        }

        updateScrollState();
        const handleScroll = () => updateScrollState();
        el.addEventListener('scroll', handleScroll);

        let handleResize: (() => void) | null = null;
        if (typeof window !== 'undefined') {
            handleResize = () => updateScrollState();
            window.addEventListener('resize', handleResize);
        }

        let resizeObserver: ResizeObserver | undefined;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => updateScrollState());
            resizeObserver.observe(el);
        }

        return () => {
            el.removeEventListener('scroll', handleScroll);
            if (handleResize) {
                window.removeEventListener('resize', handleResize);
            }
            resizeObserver?.disconnect();
        };
    }, [updateScrollState]);

    const headerCount = headers.length;
    const rowCount = React.Children.count(children);
    React.useEffect(() => {
        if (typeof window === 'undefined') {
            updateScrollState();
            return;
        }

        const timeout = window.setTimeout(updateScrollState, 0);
        return () => window.clearTimeout(timeout);
    }, [headerCount, rowCount, updateScrollState]);

    return (
        <div className="relative">
            <div ref={containerRef} className="overflow-x-auto">
                <table className="w-full min-w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase">
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="py-3 px-4">
                                {header}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">{children}</tbody>
                </table>
            </div>

            {canScrollLeft && (
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-start">
                    <div className="h-full w-8 bg-gradient-to-r from-gray-950 via-gray-950/60 to-transparent" />
                    <button
                        type="button"
                        onClick={() => scrollBy('left')}
                        className="pointer-events-auto sticky top-4 ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900/80 text-gray-200 shadow-md transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Scroll table left"
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path
                                fillRule="evenodd"
                                d="M12.78 4.22a.75.75 0 0 1 0 1.06L8.06 10l4.72 4.72a.75.75 0 0 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            )}

            {canScrollRight && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-start justify-end">
                    <button
                        type="button"
                        onClick={() => scrollBy('right')}
                        className="pointer-events-auto sticky top-4 mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900/80 text-gray-200 shadow-md transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Scroll table right"
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path
                                fillRule="evenodd"
                                d="M7.22 15.78a.75.75 0 0 1 0-1.06L11.94 10 7.22 5.28a.75.75 0 1 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 0 1-1.06 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                    <div className="h-full w-8 bg-gradient-to-l from-gray-950 via-gray-950/60 to-transparent" />
                </div>
            )}
        </div>
    );
};

export const LoadingSpinner = () => (
    <div className="p-6 flex items-center justify-center text-gray-500">Loading...</div>
);

export const ErrorDisplay = ({ error }: { error: string }) => (
    <div className="p-6 flex items-center justify-center text-red-400">{error}</div>
);

export const NoDataDisplay = ({ message }: { message: string }) => (
    <div className="p-6 flex items-center justify-center text-gray-500">{message}</div>
);

export const SummaryTab = ({ device }: { device: Partial<Device> }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard title="Device Info">
            <InfoRow label="Hostname" value={device.hostname} />
            <InfoRow label="Model" value={device.model} />
            <InfoRow label="Folder Name" value={device.folder_name} />
        </InfoCard>

        {(device.backplane_boardtype || device.backplane_barcode) && (
            <InfoCard title="Backplane Inventory">
                <InfoRow label="Board Type" value={device.backplane_boardtype} />
                <InfoRow label="Barcode" value={device.backplane_barcode} />
                <InfoRow label="Item" value={device.backplane_item} />
                <InfoRow label="Description" value={device.backplane_description} />
                <InfoRow label="Manufactured" value={device.backplane_manufactured} />
                <InfoRow label="Vendor" value={device.backplane_vendorname} />
                <InfoRow label="Issue Number" value={device.backplane_issuenumber} />
                <InfoRow label="CLEI Code" value={device.backplane_cleicode} />
                <InfoRow label="BOM" value={device.backplane_bom} />
            </InfoCard>
        )}

        {device.cpuSummaries?.[0] && (
            <InfoCard title="CPU Summary">
                <InfoRow
                    label="Current Usage"
                    value={`${device.cpuSummaries[0].system_cpu_use_rate_percent}%`}
                />
                <InfoRow
                    label="Max Usage"
                    value={`${device.cpuSummaries[0].max_cpu_usage_percent}%`}
                />
            </InfoCard>
        )}

        {device.storageSummaries?.[0] && (
            <InfoCard title="Storage">
                <InfoRow
                    label="Total"
                    value={`${device.storageSummaries[0].total_mb.toFixed(2)} MB`}
                />
                <InfoRow
                    label="Free"
                    value={`${device.storageSummaries[0].free_mb.toFixed(2)} MB`}
                />
            </InfoCard>
        )}

        {device.licenseInfos?.[0] && (
            <InfoCard title="License">
                <InfoRow label="Product" value={device.licenseInfos[0].product_name} />
                <InfoRow label="State" value={device.licenseInfos[0].state} />
                <InfoRow label="Serial" value={device.licenseInfos[0].serial_no} />
            </InfoCard>
        )}

        {device.patchInfos?.[0] && (
            <InfoCard title="Patch">
                <InfoRow label="Exists" value={String(device.patchInfos[0].patch_exists)} />
                <InfoRow label="Package" value={device.patchInfos[0].package_name} />
                <InfoRow label="Version" value={device.patchInfos[0].package_version} />
            </InfoCard>
        )}

        {device.stpConfigurations?.[0] && (
            <InfoCard title="STP Config">
                <InfoRow label="Status" value={device.stpConfigurations[0].protocol_status} />
                <InfoRow label="Standard" value={device.stpConfigurations[0].protocol_standard} />
                <InfoRow label="Bridge MAC" value={device.stpConfigurations[0].mac_address} />
            </InfoCard>
        )}
    </div>
);

export const HardwareTab = ({ components }: { components: HardwareComponent[] | null }) => {
    if (!components || components.length === 0) {
        return <NoDataDisplay message="No hardware data available." />;
    }

    const hasHealthData = components.some(
        (component) =>
            component.details &&
            (component.details.cpu_usage_percent !== undefined ||
                component.details.memory_usage_percent !== undefined)
    );
    const hasInventoryData = components.some(
        (component) =>
            component.inventory_boardtype ||
            component.inventory_barcode ||
            component.inventory_item ||
            component.inventory_vendorname
    );

    const headers = ['Slot', 'Type', 'Model', 'Status', 'Role'];
    if (hasHealthData) {
        headers.push('CPU %', 'Memory %', 'Memory Used/Total');
    }
    if (hasInventoryData) {
        headers.push('Board Type', 'Barcode', 'Vendor', 'Item');
    }

    return (
        <div className="space-y-8">
            <InfoCard title={`Hardware Components (${components.length})`}>
                <Table headers={headers}>
                    {components.map((component) => {
                        const healthData = component.details as any;
                        const hasHealth =
                            healthData &&
                            (healthData.cpu_usage_percent !== undefined ||
                                healthData.memory_usage_percent !== undefined);
                        const memUsed = healthData?.memory_used_mb;
                        const memTotal = healthData?.memory_total_mb;
                        const memDisplay = memUsed && memTotal ? `${memUsed}MB/${memTotal}MB` : '-';

                        return (
                            <tr key={component.id} className="hover:bg-gray-700/50">
                                <td className="py-3 px-4 font-mono">{component.slot}</td>
                                <td className="py-3 px-4">{component.type}</td>
                                <td className="py-3 px-4 font-mono">{component.model || '-'}</td>
                                <td className="py-3 px-4">
                                    <StatusIndicator status={component.status} />
                                </td>
                                <td className="py-3 px-4">{component.role || '-'}</td>
                                {hasHealthData && (
                                    <>
                                        <td className="py-3 px-4 text-gray-300">
                                            {hasHealth && healthData?.cpu_usage_percent !== undefined
                                                ? `${healthData.cpu_usage_percent}%`
                                                : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300">
                                            {hasHealth && healthData?.memory_usage_percent !== undefined
                                                ? `${healthData.memory_usage_percent}%`
                                                : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 font-mono text-xs">{memDisplay}</td>
                                    </>
                                )}
                                {hasInventoryData && (
                                    <>
                                        <td className="py-3 px-4 text-gray-300 font-mono text-xs">
                                            {component.inventory_boardtype || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 font-mono text-xs">
                                            {component.inventory_barcode || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300">
                                            {component.inventory_vendorname || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 font-mono text-xs">
                                            {component.inventory_item || '-'}
                                        </td>
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

export const PortsTab = ({ interfaces }: { interfaces: Interface[] | null }) => (
    <InfoCard title="Interfaces & Transceivers">
        <Table
            headers={[
                'Port',
                'PHY',
                'Proto',
                'IP Address',
                'In Util',
                'Out Util',
                'In Errors',
                'Out Errors',
                'Description',
                'Rx (dBm)',
                'Tx (dBm)',
                'TRX Type',
                'TRX S/N',
            ]}
        >
            {interfaces?.map((iface) => (
                <tr key={iface.id} className="hover:bg-gray-700/50">
                    <td className="py-3 px-4 font-mono">{iface.name}</td>
                    <td className="py-3 px-4">
                        <StatusIndicator status={iface.phy_status} />
                    </td>
                    <td className="py-3 px-4">
                        <StatusIndicator status={iface.protocol_status} />
                    </td>
                    <td className="py-3 px-4 font-mono">{iface.ip_address || '-'}</td>
                    <td className="py-3 px-4 text-gray-300">{iface.in_utilization}</td>
                    <td className="py-3 px-4 text-gray-300">{iface.out_utilization}</td>
                    <td className="py-3 px-4 text-gray-300">{iface.in_errors ?? 0}</td>
                    <td className="py-3 px-4 text-gray-300">{iface.out_errors ?? 0}</td>
                    <td className="py-3 px-4 text-gray-400">{iface.description || '-'}</td>
                    <td className="py-3 px-4 text-gray-400">
                        {iface.transceivers?.[0]?.rx_power?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                        {iface.transceivers?.[0]?.tx_power?.toFixed(2) ?? '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                        {iface.transceivers?.[0]?.type || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                        {iface.transceivers?.[0]?.serial_number || '-'}
                    </td>
                </tr>
            ))}
        </Table>
    </InfoCard>
);

export const RoutingTab = ({
                               data,
                           }: {
    data: {
        ipRoutes: IpRoute[];
        arpRecords: ARPRecord[];
    } | null;
}) => {
    const allRoutes = data?.ipRoutes ?? [];
    const bgpRoutes = allRoutes.filter(
        (route) =>
            !!route.route_distinguisher ||
            (route.protocol || '').toUpperCase().includes('BGP EVPN')
    );
    const ipRoutes = allRoutes.filter(
        (route) =>
            !(!!route.route_distinguisher || (route.protocol || '').toUpperCase().includes('BGP EVPN'))
    );

    return (
        <div className="space-y-8">
            <InfoCard title="IP Routing Table">
                <Table headers={['Destination/Mask', 'Protocol', 'NextHop', 'Interface', 'Flags', 'Pref', 'Cost']}>
                    {ipRoutes.map((route) => (
                        <tr key={route.id} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{route.destination_mask}</td>
                            <td className="py-2 px-3">{route.protocol}</td>
                            <td className="py-2 px-3 font-mono">{route.next_hop}</td>
                            <td className="py-2 px-3 font-mono text-xs">
                                {(route.interface as any)?.name || '-'}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">{route.flags || '-'}</td>
                            <td className="py-2 px-3">{route.preference}</td>
                            <td className="py-2 px-3">{route.cost}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="BGP Routing Table">
                <Table headers={['Type', 'Network', 'NextHop', 'Status', 'Loc Prf', 'MED', 'Pref Val', 'Path', 'RD']}>
                    {bgpRoutes.map((route) => (
                        <tr key={route.id} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3">
                                {(route.protocol || '').toUpperCase().includes('BGP EVPN') ? 'BGP EVPN' : 'BGP'}
                            </td>
                            <td className="py-2 px-3 font-mono">{route.network || route.destination_mask}</td>
                            <td className="py-2 px-3 font-mono">{route.next_hop}</td>
                            <td className="py-2 px-3 font-mono text-xs">{route.status || '-'}</td>
                            <td className="py-2 px-3">{route.loc_prf ?? '-'}</td>
                            <td className="py-2 px-3">{route.med || '-'}</td>
                            <td className="py-2 px-3">{route.pref_val ?? '-'}</td>
                            <td className="py-2 px-3 font-mono text-xs">{route.path_ogn || '-'}</td>
                            <td className="py-2 px-3 font-mono text-xs">{route.route_distinguisher || '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="ARP Table">
                <Table headers={['IP Address', 'MAC Address', 'Type', 'Interface', 'VLAN']}>
                    {data?.arpRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{record.ip_address}</td>
                            <td className="py-2 px-3 font-mono">{record.mac_address}</td>
                            <td className="py-2 px-3">{record.type}</td>
                            <td className="py-2 px-3 font-mono">{record.interface}</td>
                            <td className="py-2 px-3">{record.vlan}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>
        </div>
    );
};

export const ProtocolsTab = ({
                                 data,
                             }: {
    data:
        | {
        bgpPeers: BgpPeer[];
        ospfDetails: OspfDetail[];
        isisPeers: IsisPeer[];
        bfdSessions: BfdSession[];
    }
        | null;
}) => (
    <div className="space-y-8">
        <InfoCard title="BGP Peers">
            <Table
                headers={[
                    'Peer IP',
                    'Remote AS',
                    'State',
                    'Address Family',
                    'Version',
                    'Out Queue',
                    'Prefixes',
                    'VPN Instance',
                    'Msg Rcvd',
                    'Msg Sent',
                ]}
            >
                {data?.bgpPeers.map((peer) => (
                    <tr key={peer.id} className="hover:bg-gray-700/50">
                        <td className="py-2 px-3 font-mono">{peer.peer_ip}</td>
                        <td>{peer.remote_as}</td>
                        <td>
                            <StatusIndicator status={peer.state} />
                        </td>
                        <td className="font-mono">{peer.address_family}</td>
                        <td>{peer.version ?? '-'}</td>
                        <td>{peer.out_queue ?? '-'}</td>
                        <td>{peer.prefixes_received ?? '-'}</td>
                        <td className="font-mono text-xs">{peer.vpn_instance || '-'}</td>
                        <td>{peer.msg_rcvd}</td>
                        <td>{peer.msg_sent}</td>
                    </tr>
                ))}
            </Table>
        </InfoCard>

        <InfoCard title="OSPF Interfaces">
            <Table headers={['Interface', 'Cost', 'State', 'Type']}>
                {data?.ospfDetails.map((detail) => (
                    <tr key={detail.id} className="hover:bg-gray-700/50">
                        <td className="py-2 px-3 font-mono">{detail.interface.name}</td>
                        <td>{detail.cost}</td>
                        <td>{detail.state}</td>
                        <td>{detail.type}</td>
                    </tr>
                ))}
            </Table>
        </InfoCard>

        <InfoCard title="IS-IS Peers">
            <Table headers={['Interface', 'System ID', 'State', 'Type', 'Hold Time']}>
                {data?.isisPeers.map((peer) => (
                    <tr key={peer.id} className="hover:bg-gray-700/50">
                        <td className="py-2 px-3 font-mono">{peer.interface.name}</td>
                        <td className="font-mono">{peer.system_id}</td>
                        <td>
                            <StatusIndicator status={peer.state} />
                        </td>
                        <td>{peer.type}</td>
                        <td>{peer.hold_time}</td>
                    </tr>
                ))}
            </Table>
        </InfoCard>

        <InfoCard title="BFD Sessions">
            <Table headers={['Interface', 'Peer IP', 'State', 'Type', 'Local Disc.']}>
                {data?.bfdSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-700/50">
                        <td className="py-2 px-3 font-mono">{session.interface.name}</td>
                        <td className="font-mono">{session.peer_ip_address}</td>
                        <td>
                            <StatusIndicator status={session.state} />
                        </td>
                        <td>{session.type}</td>
                        <td>{session.local_discriminator}</td>
                    </tr>
                ))}
            </Table>
        </InfoCard>
    </div>
);

export const VpnTab = ({
                           data,
                       }: {
    data: {
        mplsL2vcs: MplsL2vc[];
        vpnInstances: VpnInstance[];
        vxlanTunnels: VxlanTunnel[];
    } | null;
}) => (
    <div className="space-y-8">
        <InfoCard title="MPLS L2VCs (Virtual Circuits)">
            <Table headers={['Interface', 'Destination', 'VC ID', 'State', 'Local Label', 'Remote Label']}>
                {data?.mplsL2vcs.map((vc) => (
                    <tr key={vc.id} className="hover:bg-gray-700/50">
                        <td className="py-2 px-3 font-mono">{vc.interface.name}</td>
                        <td className="font-mono">{vc.destination}</td>
                        <td>{vc.vc_id}</td>
                        <td>
                            <StatusIndicator status={vc.session_state} />
                        </td>
                        <td>{vc.local_label}</td>
                        <td>{vc.remote_label}</td>
                    </tr>
                ))}
            </Table>
        </InfoCard>

        <InfoCard title="VPN Instances (VRFs)">
            <Table headers={['Name', 'Route Distinguisher (RD)', 'Address Family']}>
                {data?.vpnInstances.map((instance) => (
                    <tr key={instance.id} className="hover:bg-gray-700/50">
                        <td className="py-2 px-3 font-mono">{instance.name}</td>
                        <td className="font-mono">{instance.rd || '-'}</td>
                        <td className="font-mono">{instance.address_family}</td>
                    </tr>
                ))}
            </Table>
        </InfoCard>

        <InfoCard title="VXLAN Tunnels">
            <Table headers={['VPN Instance', 'Tunnel ID', 'Source', 'Destination', 'State', 'Type', 'Uptime']}>
                {data?.vxlanTunnels.map((tunnel) => (
                    <tr key={tunnel.id} className="hover:bg-gray-700/50">
                        <td className="py-2 px-3 font-mono">{tunnel.vpn_instance}</td>
                        <td>{tunnel.tunnel_id}</td>
                        <td className="font-mono">{tunnel.source}</td>
                        <td className="font-mono">{tunnel.destination}</td>
                        <td>
                            <StatusIndicator status={tunnel.state} />
                        </td>
                        <td>{tunnel.type || '-'}</td>
                        <td>{tunnel.uptime || '-'}</td>
                    </tr>
                ))}
            </Table>
        </InfoCard>
    </div>
);

export const VlansTab = ({ vlans, portVlans }: { vlans: Vlan[] | null; portVlans: PortVlan[] | null }) => (
    <div className="space-y-8">
        <InfoCard title="VLANs">
            <Table headers={['VID', 'Status', 'Property', 'MAC Learn', 'Statistics', 'Description']}>
                {vlans?.map((vlan) => (
                    <tr key={vlan.id} className="hover:bg-gray-700/50">
                        <td className="py-2 px-3 font-mono">{vlan.vid}</td>
                        <td>
                            <StatusIndicator status={vlan.status} />
                        </td>
                        <td>{vlan.property || '-'}</td>
                        <td>{vlan.mac_learn || '-'}</td>
                        <td>{vlan.statistics || '-'}</td>
                        <td className="text-gray-400">{vlan.description || '-'}</td>
                    </tr>
                ))}
            </Table>
        </InfoCard>

        <InfoCard title="Port VLAN Mapping">
            <Table headers={['Port', 'Link Type', 'PVID', 'VLAN List']}>
                {portVlans?.map((portVlan) => (
                    <tr key={portVlan.id} className="hover:bg-gray-700/50">
                        <td className="py-2 px-3 font-mono">{portVlan.port_name}</td>
                        <td>{portVlan.link_type || '-'}</td>
                        <td>{portVlan.pvid ?? '-'}</td>
                        <td className="text-gray-400">{portVlan.vlan_list || '-'}</td>
                    </tr>
                ))}
            </Table>
        </InfoCard>
    </div>
);

export const EthTrunksTab = ({ trunks }: { trunks: EthTrunk[] | null }) => (
    <InfoCard title="Eth-Trunks">
        <Table headers={['Trunk ID', 'Mode', 'Working Mode', 'Status', 'Up Ports']}>
            {trunks?.map((trunk) => (
                <tr key={trunk.id} className="hover:bg-gray-700/50">
                    <td className="py-2 px-3 font-mono">{trunk.trunk_id}</td>
                    <td>{trunk.mode_type || '-'}</td>
                    <td>{trunk.working_mode || '-'}</td>
                    <td>
                        <StatusIndicator status={trunk.operating_status} />
                    </td>
                    <td>{trunk.number_of_up_ports ?? '-'}</td>
                </tr>
            ))}
        </Table>
    </InfoCard>
);

export const ETrunksTab = ({ etrunks }: { etrunks: ETrunk[] | null }) => {
    if (!etrunks || etrunks.length === 0) {
        return <NoDataDisplay message="No E-Trunk data found." />;
    }

    return (
        <div className="space-y-8">
            <InfoCard title="Overview">
                <Table headers={['E-Trunk ID', 'State', 'VPN Instance', 'Interface', 'Work Mode']}>
                    {etrunks.map((etrunk) => (
                        <tr key={etrunk.id} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{etrunk.etrunk_id}</td>
                            <td>
                                <StatusIndicator status={etrunk.state} />
                            </td>
                            <td className="font-mono text-xs">{etrunk.vpn_instance || '-'}</td>
                            <td className="font-mono text-xs">{etrunk.interface_name || '-'}</td>
                            <td>{etrunk.work_mode || '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="IP Addresses and Network Parameters">
                <Table headers={['E-Trunk ID', 'Peer IP', 'Source IP', 'Local IP']}>
                    {etrunks.map((etrunk) => (
                        <tr key={`${etrunk.id}-ip`} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{etrunk.etrunk_id}</td>
                            <td className="font-mono">{etrunk.peer_ip || '-'}</td>
                            <td className="font-mono">{etrunk.source_ip || '-'}</td>
                            <td className="font-mono text-xs">{etrunk.local_ip || '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="Priorities and System ID">
                <Table headers={['E-Trunk ID', 'Priority', 'System ID', 'Peer Priority', 'Peer System ID']}>
                    {etrunks.map((etrunk) => (
                        <tr key={`${etrunk.id}-prio`} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{etrunk.etrunk_id}</td>
                            <td>{etrunk.priority ?? '-'}</td>
                            <td className="font-mono text-xs">{etrunk.system_id || '-'}</td>
                            <td>{etrunk.peer_priority ?? '-'}</td>
                            <td className="font-mono text-xs">{etrunk.peer_system_id || '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="States and Operating Modes">
                <Table headers={['E-Trunk ID', 'State', 'Local State', 'Local Phy State', 'Causation']}>
                    {etrunks.map((etrunk) => (
                        <tr key={`${etrunk.id}-state`} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{etrunk.etrunk_id}</td>
                            <td>
                                <StatusIndicator status={etrunk.state} />
                            </td>
                            <td>{etrunk.local_state || '-'}</td>
                            <td>{etrunk.local_phy_state || '-'}</td>
                            <td>{etrunk.causation || '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="Links and Members">
                <Table headers={['E-Trunk ID', 'Max Active Links', 'Min Active Links', 'Member Count']}>
                    {etrunks.map((etrunk) => (
                        <tr key={`${etrunk.id}-links`} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{etrunk.etrunk_id}</td>
                            <td>{etrunk.max_active_link_number ?? '-'}</td>
                            <td>{etrunk.min_active_link_number ?? '-'}</td>
                            <td>{etrunk.member_count ?? '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="Timings and Configuration">
                <Table headers={['E-Trunk ID', 'Revert Delay (s)', 'Send Period (100ms)', 'Fail Time (100ms)', 'Peer Fail Time (100ms)']}>
                    {etrunks.map((etrunk) => (
                        <tr key={`${etrunk.id}-timing`} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{etrunk.etrunk_id}</td>
                            <td>{etrunk.revert_delay_time_s ?? '-'}</td>
                            <td>{etrunk.send_period_100ms ?? '-'}</td>
                            <td>{etrunk.fail_time_100ms ?? '-'}</td>
                            <td>{etrunk.peer_fail_time_100ms ?? '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            <InfoCard title="Statistics">
                <Table headers={['E-Trunk ID', 'Receive', 'Send', 'Rec Drop', 'Snd Drop']}>
                    {etrunks.map((etrunk) => (
                        <tr key={`${etrunk.id}-stats`} className="hover:bg-gray-700/50">
                            <td className="py-2 px-3 font-mono">{etrunk.etrunk_id}</td>
                            <td>{etrunk.receive ?? '-'}</td>
                            <td>{etrunk.send ?? '-'}</td>
                            <td>{etrunk.recdrop ?? '-'}</td>
                            <td>{etrunk.snddrop ?? '-'}</td>
                        </tr>
                    ))}
                </Table>
            </InfoCard>

            {etrunks.some(
                (etrunk) =>
                    (etrunk.members && Array.isArray(etrunk.members) && etrunk.members.length > 0) ||
                    etrunk.member_type ||
                    etrunk.member_id ||
                    etrunk.member_state
            ) && (
                <InfoCard title="Member Information">
                    <Table
                        headers={[
                            'E-Trunk ID',
                            'Member Type',
                            'Member ID',
                            'Local Phy State',
                            'Work Mode',
                            'State',
                            'Causation',
                            'Remote ID',
                        ]}
                    >
                        {etrunks.flatMap((etrunk) => {
                            if (etrunk.members && Array.isArray(etrunk.members) && etrunk.members.length > 0) {
                                return etrunk.members.map((member: any, idx: number) => (
                                    <tr key={`${etrunk.id}-member-${idx}`} className="hover:bg-gray-700/50">
                                        <td className="py-2 px-3 font-mono">{etrunk.etrunk_id}</td>
                                        <td>{member.type || '-'}</td>
                                        <td>{member.id ?? '-'}</td>
                                        <td>{member.local_phy_state || '-'}</td>
                                        <td>{member.work_mode || '-'}</td>
                                        <td>
                                            <StatusIndicator status={member.state} />
                                        </td>
                                        <td>{member.causation || '-'}</td>
                                        <td className="font-mono text-xs">{member.remote_id || '-'}</td>
                                    </tr>
                                ));
                            }

                            if (etrunk.member_type || etrunk.member_id || etrunk.member_state) {
                                return [
                                    <tr key={`${etrunk.id}-member`} className="hover:bg-gray-700/50">
                                        <td className="py-2 px-3 font-mono">{etrunk.etrunk_id}</td>
                                        <td>{etrunk.member_type || '-'}</td>
                                        <td>{etrunk.member_id ?? '-'}</td>
                                        <td>{etrunk.local_phy_state || '-'}</td>
                                        <td>{etrunk.work_mode || '-'}</td>
                                        <td>
                                            <StatusIndicator status={etrunk.member_state} />
                                        </td>
                                        <td>{etrunk.member_causation || '-'}</td>
                                        <td className="font-mono text-xs">{etrunk.member_remote_id || '-'}</td>
                                    </tr>,
                                ];
                            }

                            return [];
                        })}
                    </Table>
                </InfoCard>
            )}
        </div>
    );
};