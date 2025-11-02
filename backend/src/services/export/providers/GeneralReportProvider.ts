import {injectable, inject} from "inversify";
import * as xlsx from 'xlsx';
import {IReportProvider} from "./IReportProvider";
import {IReportRepository} from "../../../repositories/ReportRepository";
import {TYPES} from "../../../types";
import {Device} from "../../../models/Device";

@injectable()
export class GeneralReportProvider implements IReportProvider {
    readonly reportId = 'per_device_details';

    constructor(
        @inject(TYPES.ReportRepository) private reportRepo: IReportRepository
    ) {
    }

    async generate(snapshotId: number): Promise<xlsx.WorkBook> {
        const devicesToProcess = await this.reportRepo.getDevicesForSnapshot(snapshotId);

        const wb = xlsx.utils.book_new();

        for (const basicDevice of devicesToProcess) {
            console.log(`[GeneralReportProvider] Processing device: ${basicDevice.hostname}`);

            const [
                summaryData,
                interfaceData,
                routingData,
                protocolsData,
                hardwareData,
                vpnData,
                alarmsData,
                l2Data
            ] = await Promise.all([
                this.reportRepo.findForSummary(basicDevice.id, snapshotId),
                this.reportRepo.findWithInterfaces(basicDevice.id, snapshotId),
                this.reportRepo.findWithRouting(basicDevice.id, snapshotId),
                this.reportRepo.findWithProtocols(basicDevice.id, snapshotId),
                this.reportRepo.findWithHardware(basicDevice.id, snapshotId),
                this.reportRepo.findWithVpn(basicDevice.id, snapshotId),
                this.reportRepo.findWithAlarms(basicDevice.id, snapshotId),
                this.reportRepo.findWithL2(basicDevice.id, snapshotId)
            ]);

            const device: Device = {
                ...basicDevice,
                ...summaryData, ...interfaceData, ...routingData,
                ...protocolsData, ...hardwareData, ...vpnData, ...alarmsData,
                ...l2Data
            };

            const baseSheetName = device.hostname.substring(0, 20);

            this._addSheet(wb, `${baseSheetName}-Summary`, [
                {Key: 'Hostname', Value: device.hostname},
                {Key: 'Model', Value: device.model},
                {Key: 'Folder Name', Value: device.folder_name},
                ...(device.cpuSummaries?.map(s => ({
                    Key: 'CPU Usage',
                    Value: `${s.system_cpu_use_rate_percent}%`
                })) || []),
                ...(device.storageSummaries?.map(s => ({Key: 'Storage Free', Value: `${s.free_mb} MB`})) || []),
                ...(device.licenseInfos?.map(l => ({Key: 'License', Value: l.product_name, State: l.state})) || []),
                ...(device.patchInfos?.map(p => ({
                    Key: 'Patch',
                    Value: p.package_name,
                    Version: p.package_version
                })) || []),
                ...(device.stpConfigurations?.map(s => ({
                    Key: 'STP Status',
                    Value: s.protocol_status,
                    Standard: s.protocol_standard
                })) || []),
            ]);

            this._addSheet(wb, `${baseSheetName}-Hardware`, device.hardwareComponents?.map(c => {
                const health = c.details as any;
                const mem = (health?.memory_used_mb && health?.memory_total_mb) ? `${health.memory_used_mb}MB/${health.memory_total_mb}MB` : '-';
                return {
                    Slot: c.slot,
                    Type: c.type,
                    Model: c.model,
                    Status: c.status,
                    Role: c.role,
                    'CPU %': health?.cpu_usage_percent,
                    'Memory %': health?.memory_usage_percent,
                    'Memory Used/Total': mem,
                }
            }));

            this._addSheet(wb, `${baseSheetName}-Ports`, device.interfaces?.map(i => ({
                Name: i.name,
                PHY: i.phy_status,
                Proto: i.protocol_status,
                IP: i.ip_address,
                'In Util': i.in_utilization,
                'Out Util': i.out_utilization,
                'In Errors': i.in_errors,
                'Out Errors': i.out_errors,
                Desc: i.description,
                'TRX Rx': i.transceivers?.[0]?.rx_power,
                'TRX Tx': i.transceivers?.[0]?.tx_power,
                'TRX Type': i.transceivers?.[0]?.type,
                'TRX S/N': i.transceivers?.[0]?.serial_number,
            })));

            const allRoutes = device.ipRoutes || [];
            const bgpRoutes = allRoutes.filter(r => !!r.route_distinguisher || ((r.protocol || '').toUpperCase().includes('BGP EVPN')));
            const ipRoutes = allRoutes.filter(r => !(!!r.route_distinguisher || ((r.protocol || '').toUpperCase().includes('BGP EVPN'))));

            this._addSheet(wb, `${baseSheetName}-IP-Routes`, ipRoutes.map(r => ({
                Destination: r.destination_mask,
                Protocol: r.protocol,
                NextHop: r.next_hop,
                Interface: r.interface?.name,
                Flags: r.flags,
                Pref: r.preference,
                Cost: r.cost
            })));

            this._addSheet(wb, `${baseSheetName}-BGP-Routes`, bgpRoutes.map(r => ({
                Type: ((r.protocol || '').toUpperCase().includes('BGP EVPN')) ? 'BGP EVPN' : 'BGP',
                Network: r.network || r.destination_mask,
                NextHop: r.next_hop,
                Status: r.status,
                'Loc Prf': r.loc_prf,
                MED: r.med,
                'Pref Val': r.pref_val,
                Path: r.path_ogn,
                RD: r.route_distinguisher,
            })));

            this._addSheet(wb, `${baseSheetName}-ARP`, device.arpRecords?.map(r => ({
                'IP Address': r.ip_address,
                'MAC Address': r.mac_address,
                Type: r.type,
                Interface: r.interface,
                VLAN: r.vlan
            })));

            this._addSheet(wb, `${baseSheetName}-BGP-Peers`, device.bgpPeers?.map(p => ({
                Peer: p.peer_ip,
                RemoteAS: p.remote_as,
                State: p.state,
                Family: p.address_family,
                Version: p.version,
                OutQueue: p.out_queue,
                PrefixesRcv: p.prefixes_received,
                VPN: p.vpn_instance,
                Rcvd: p.msg_rcvd,
                Sent: p.msg_sent
            })));

            this._addSheet(wb, `${baseSheetName}-OSPF`, device.ospfInterfaceDetails?.map(o => ({
                Interface: o.interface.name, Cost: o.cost, State: o.state, Type: o.type
            })));

            this._addSheet(wb, `${baseSheetName}-ISIS`, device.isisPeers?.map(p => ({
                Interface: p.interface.name, SystemID: p.system_id, State: p.state, Type: p.type, HoldTime: p.hold_time
            })));

            this._addSheet(wb, `${baseSheetName}-BFD`, device.bfdSessions?.map(s => ({
                Interface: s.interface.name,
                Peer: s.peer_ip_address,
                State: s.state,
                Type: s.type,
                'Local Disc': s.local_discriminator
            })));

            this._addSheet(wb, `${baseSheetName}-VPN-Inst`, device.vpnInstances?.map(v => ({
                Name: v.name, RD: v.rd, Family: v.address_family
            })));

            this._addSheet(wb, `${baseSheetName}-MPLS-L2VC`, device.mplsL2vcs?.map(vc => ({
                Interface: vc.interface.name,
                Destination: vc.destination,
                VC_ID: vc.vc_id,
                State: vc.session_state,
                'Local Label': vc.local_label,
                'Remote Label': vc.remote_label
            })));

            this._addSheet(wb, `${baseSheetName}-VXLAN`, device.vxlanTunnels?.map(t => ({
                VPN: t.vpn_instance,
                'Tunnel ID': t.tunnel_id,
                Source: t.source,
                Destination: t.destination,
                State: t.state,
                Type: t.type,
                Uptime: t.uptime
            })));

            this._addSheet(wb, `${baseSheetName}-VLANs`, device.vlans?.map(v => ({
                VID: v.vid,
                Status: v.status,
                Property: v.property,
                'MAC Learn': v.mac_learn,
                Stats: v.statistics,
                Description: v.description
            })));

            this._addSheet(wb, `${baseSheetName}-Port-VLAN`, device.portVlans?.map(pv => ({
                Port: pv.port_name, 'Link Type': pv.link_type, PVID: pv.pvid, 'VLAN List': pv.vlan_list
            })));

            const ethTrunkData = device.ethTrunks?.map(t => {
                const localInfo = t.local_info || {};
                return {
                    'Trunk ID': t.trunk_id,
                    'Mode': t.mode_type,
                    'Work Mode': t.working_mode,
                    'Status': t.operating_status,
                    'Up Ports': t.number_of_up_ports,
                    'LAG ID': localInfo.lag_id,
                    'System Priority': localInfo.system_priority,
                    'System ID': localInfo.system_id,
                    'Hash Arithmetic': localInfo.hash_arithmetic,
                    'Least Active Links': localInfo['least-active-linknumber'] ?? localInfo['least_active_linknumber'],
                    'Max Active Links': localInfo['max-active-linknumber'] ?? localInfo['max_active_linknumber'],
                    'Timeout Period': localInfo.timeout_period,
                    'Preempt Delay Time': localInfo.preempt_delay_time,
                    'Max Brandwidth': localInfo.max_bandwidth ?? localInfo.max_brandwidth,
                };
            });

            this._addSheet(wb, `${baseSheetName}-Eth-Trunks`, ethTrunkData);

            const actorPortsData = device.ethTrunks?.flatMap(t => {
                const actorPorts = t.ports_info?.actor_ports || [];
                return actorPorts.map((port: any) => ({
                    'Trunk ID': t.trunk_id,
                    'Port Name': port.port_name, 'Status': port.status, 'Port Type': port.port_type,
                    'Priority': port.priority, 'Port No': port.port_no, 'Port Key': port.port_key,
                    'Port State': port.port_state, 'Weight': port.weight,
                }));
            });

            this._addSheet(wb, `${baseSheetName}-LACP-Actor`, actorPortsData);

            const partnerPortsData = device.ethTrunks?.flatMap(t => {
                const partnerPorts = t.ports_info?.partner_ports || [];
                return partnerPorts.map((port: any) => ({
                    'Trunk ID': t.trunk_id,
                    'Port Name': port.port_name, 'Status': port.status, 'Port Type': port.port_type,
                    'Priority': port.priority, 'Port No': port.port_no, 'Port Key': port.port_key,
                    'Port State': port.port_state, 'Weight': port.weight,
                }));
            });

            this._addSheet(wb, `${baseSheetName}-LACP-Partner`, partnerPortsData);

            const normalPortsData = device.ethTrunks?.flatMap(t => {
                const normalPorts = t.ports_info?.normal_ports || [];
                return normalPorts.map((port: any) => ({
                    'Trunk ID': t.trunk_id,
                    'Port Name': port.port_name, 'Status': port.status, 'Weight': port.weight,
                }));
            });

            this._addSheet(wb, `${baseSheetName}-Trunk-Ports`, normalPortsData);

            const etrunks = device.etrunks || [];

            const eTrunkData = etrunks.flatMap(e => {
                const baseInfo = {
                    'E-Trunk ID': e.etrunk_id,
                    'State': e.state,
                    'VPN Instance': e.vpn_instance,
                    'Interface': e.interface_name,
                    'Work Mode': e.work_mode,
                    'Peer IP': e.peer_ip,
                    'Source IP': e.source_ip,
                    'Local IP': e.local_ip,
                    'Priority': e.priority,
                    'System ID': e.system_id,
                    'Peer Priority': e.peer_priority,
                    'Peer System ID': e.peer_system_id,
                    'Local State': e.local_state,
                    'Local Phy State': e.local_phy_state,
                    'Causation': e.causation,
                    'Max Active Links': e.max_active_link_number,
                    'Min Active Links': e.min_active_link_number,
                    'Member Count': e.member_count,
                    'Revert Delay (s)': e.revert_delay_time_s,
                    'Send Period (100ms)': e.send_period_100ms,
                    'Fail Time (100ms)': e.fail_time_100ms,
                    'Peer Fail Time (100ms)': e.peer_fail_time_100ms,
                    'Receive': e.receive,
                    'Send': e.send,
                    'Rec Drop': e.recdrop,
                    'Snd Drop': e.snddrop,
                };

                if (e.members && Array.isArray(e.members) && e.members.length > 0) {
                    return e.members.map((member: any) => ({
                        ...baseInfo,
                        'Member Type': member.type,
                        'Member ID': member.id,
                        'Member Local Phy State': member.local_phy_state,
                        'Member Work Mode': member.work_mode,
                        'Member State': member.state,
                        'Member Causation': member.causation,
                        'Member Remote ID': member.remote_id
                    }));
                } else if (e.member_type || e.member_id || e.member_state) {
                    return [{
                        ...baseInfo,
                        'Member Type': e.member_type,
                        'Member ID': e.member_id,
                        'Member Local Phy State': e.local_phy_state,
                        'Member Work Mode': e.work_mode,
                        'Member State': e.member_state,
                        'Member Causation': e.member_causation,
                        'Member Remote ID': e.member_remote_id
                    }];
                }

                console.log([{...baseInfo}]);

                return [{...baseInfo}];
            });

            this._addSheet(wb, `${baseSheetName}-E-Trunks`, eTrunkData);

            this._addSheet(wb, `${baseSheetName}-Alarms`, device.alarms?.map(a => ({
                Index: a.index,
                Level: a.level,
                Date: a.date,
                Time: a.time,
                Info: a.info,
                OID: a.oid,
                'ENT Code': a.ent_code
            })));
        }
        return wb;
    }

    private _addSheet(wb: xlsx.WorkBook, sheetName: string, data: any[] | undefined | null): void {
        if (!data || data.length === 0) return;

        const finalSheetName = sheetName.substring(0, 31);

        const ws = xlsx.utils.json_to_sheet(data);

        const cols = Object.keys(data[0]).map(key => ({
            wch: Math.max(key.length, ...data.map(row => row[key] ? row[key].toString().length : 0)) + 2
        }));
        ws['!cols'] = cols;

        xlsx.utils.book_append_sheet(wb, ws, finalSheetName);
    }
}