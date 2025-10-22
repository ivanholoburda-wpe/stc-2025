import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "bgp_peers" })
@Unique(["peer_ip", "address_family", "device", "snapshot"])
export class BgpPeer {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @Column({ type: "varchar" })
    peer_ip!: string;

    @Column({ type: "varchar", default: "ipv4_unicast" })
    address_family!: string;

    @Column({ type: "integer" })
    remote_as!: number;

    @Column({ type: "varchar" })
    state!: string;

    @Column({ type: "varchar", nullable: true })
    up_down_time?: string;

    @Column({ type: "integer" })
    msg_rcvd!: number;

    @Column({ type: "integer" })
    msg_sent!: number;
}