import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Interface } from "./Interface";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "mpls_l2vc" })
@Unique(["interface", "vc_id", "destination", "device", "snapshot"])
export class MplsL2vc {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Interface, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "interface_id" })
    interface!: Interface;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @Column({ type: "varchar" })
    interface_state!: string;

    @Column({ type: "varchar" })
    session_state!: string;

    @Column({ type: "integer" })
    vc_id!: number;

    @Column({ type: "varchar" })
    vc_type!: string;

    @Column({ type: "varchar" })
    destination!: string;

    @Column({ type: "integer" })
    local_label!: number;

    @Column({ type: "integer" })
    remote_label!: number;

    @Column({ type: "integer" })
    local_mtu!: number;

    @Column({ type: "integer" })
    remote_mtu!: number;

    @Column({ type: "varchar", nullable: true })
    primary_tunnel_type?: string;

    @Column({ type: "varchar", nullable: true })
    primary_tunnel_id?: string;

    @Column({ type: "varchar", nullable: true })
    backup_tunnel_type?: string;

    @Column({ type: "varchar", nullable: true })
    backup_tunnel_id?: string;

    @Column({ type: "varchar", nullable: true })
    create_time?: string;

    @Column({ type: "varchar", nullable: true })
    up_time?: string;

    @Column({ type: "varchar", nullable: true })
    last_up_time?: string;
}