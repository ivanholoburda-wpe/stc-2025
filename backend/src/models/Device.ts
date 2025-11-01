import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Snapshot } from "./Snapshot";
import { Interface } from "./Interface";
import { Transceiver } from "./Transceiver";
import { Alarm } from "./Alarm";
import { ARPRecord } from "./ARPRecord";
import { BfdSession } from "./BfdSession";
import { BgpPeer } from "./BgpPeer";
import { CpuUsageSummary } from "./CpuUsageSummary";
import { HardwareComponent } from "./HardwareComponent";
import { IpRoute } from "./IpRoute";
import { IsisPeer } from "./IsisPeer";
import { LicenseInfo } from "./LicenseInfo";
import { MplsL2vc } from "./MplsL2vc";
import { OspfInterfaceDetail } from "./OspfInterfaceDetail";
import { PatchInfo } from "./PatchInfo";
import { StorageSummary } from "./StorageSummary";
import { StpConfiguration } from "./StpConfiguration";
import { VpnInstance } from "./VpnInstance";
import { EthTrunk } from "./EthTrunk";
import { Vlan } from "./Vlan";
import { PortVlan } from "./PortVlan";
import { VxlanTunnel } from "./VxlanTunnel";
import { ETrunk } from "./ETrunk";

@Entity({ name: "devices" })
export class Device {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({type: "varchar"})
    folder_name!: string;

    @Column({ type: "varchar", nullable: true })
    hostname!: string;

    @Column({ type: "varchar", nullable: true })
    model?: string;

    @ManyToOne(() => Snapshot, (snapshot: Snapshot) => snapshot.devices)
    @JoinColumn({ name: "first_seen_snapshot_id" })
    firstSeenSnapshot!: Snapshot;

    @OneToMany(() => Interface, (iface: Interface) => iface.device)
    interfaces?: Interface[];

    @OneToMany(() => Transceiver, (transceiver: Transceiver) => transceiver.device)
    transceivers?: Transceiver[];

    @OneToMany(() => Alarm, (alarm: Alarm) => alarm.device)
    alarms?: Alarm[];

    @OneToMany(() => ARPRecord, (record) => record.device)
    arpRecords?: ARPRecord[];

    @OneToMany(() => BfdSession, (session) => session.device)
    bfdSessions?: BfdSession[];

    @OneToMany(() => BgpPeer, (peer) => peer.device)
    bgpPeers?: BgpPeer[];

    @OneToMany(() => CpuUsageSummary, (summary) => summary.device)
    cpuSummaries?: CpuUsageSummary[];

    @OneToMany(() => HardwareComponent, (component) => component.device)
    hardwareComponents?: HardwareComponent[];

    @OneToMany(() => IpRoute, (route) => route.device)
    ipRoutes?: IpRoute[];

    @OneToMany(() => IsisPeer, (peer) => peer.device)
    isisPeers?: IsisPeer[];

    @OneToMany(() => LicenseInfo, (info) => info.device)
    licenseInfos?: LicenseInfo[];

    @OneToMany(() => MplsL2vc, (vc) => vc.device)
    mplsL2vcs?: MplsL2vc[];

    @OneToMany(() => OspfInterfaceDetail, (detail) => detail.device)
    ospfInterfaceDetails?: OspfInterfaceDetail[];

    @OneToMany(() => PatchInfo, (info) => info.device)
    patchInfos?: PatchInfo[];

    @OneToMany(() => StorageSummary, (summary) => summary.device)
    storageSummaries?: StorageSummary[];

    @OneToMany(() => StpConfiguration, (config) => config.device)
    stpConfigurations?: StpConfiguration[];

    @OneToMany(() => VpnInstance, (instance) => instance.device)
    vpnInstances?: VpnInstance[];

    @OneToMany(() => EthTrunk, (trunk) => trunk.device)
    ethTrunks?: EthTrunk[];

    @OneToMany(() => Vlan, (vlan) => vlan.device)
    vlans?: Vlan[];

    @OneToMany(() => PortVlan, (portVlan) => portVlan.device)
    portVlans?: PortVlan[];

    @OneToMany(() => VxlanTunnel, (tunnel) => tunnel.device)
    vxlanTunnels?: VxlanTunnel[];

    @OneToMany(() => ETrunk, (etrunk) => etrunk.device)
    etrunks?: ETrunk[];
}
