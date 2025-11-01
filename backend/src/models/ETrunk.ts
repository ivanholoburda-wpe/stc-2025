import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Device } from "./Device";
import { Snapshot } from "./Snapshot";

@Entity({ name: "etrunks" })
@Unique(["device", "snapshot", "etrunk_id"])
export class ETrunk {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @Column({ type: "integer" })
    etrunk_id!: number;

    @Column({ type: "varchar", nullable: true })
    state?: string;

    @Column({ type: "varchar", nullable: true })
    vpn_instance?: string;

    @Column({ type: "varchar", nullable: true })
    peer_ip?: string;

    @Column({ type: "varchar", nullable: true })
    source_ip?: string;

    @Column({ type: "integer", nullable: true })
    priority?: number;

    @Column({ type: "varchar", nullable: true })
    system_id?: string;

    @Column({ type: "varchar", nullable: true })
    peer_system_id?: string;

    @Column({ type: "integer", nullable: true })
    peer_priority?: number;

    @Column({ type: "varchar", nullable: true })
    causation?: string;

    @Column({ type: "integer", nullable: true })
    revert_delay_time_s?: number;

    @Column({ type: "integer", nullable: true })
    send_period_100ms?: number;

    @Column({ type: "integer", nullable: true })
    fail_time_100ms?: number;

    @Column({ type: "integer", nullable: true })
    peer_fail_time_100ms?: number;

    @Column({ type: "integer", nullable: true })
    receive?: number;

    @Column({ type: "integer", nullable: true })
    send?: number;

    @Column({ type: "integer", nullable: true })
    recdrop?: number;

    @Column({ type: "integer", nullable: true })
    snddrop?: number;

    @Column({ type: "varchar", nullable: true })
    local_ip?: string;

    @Column({ type: "varchar", nullable: true })
    interface_name?: string;

    @Column({ type: "integer", nullable: true })
    max_active_link_number?: number;

    @Column({ type: "integer", nullable: true })
    min_active_link_number?: number;

    @Column({ type: "varchar", nullable: true })
    work_mode?: string;

    @Column({ type: "varchar", nullable: true })
    local_phy_state?: string;

    @Column({ type: "varchar", nullable: true })
    local_state?: string;

    @Column({ type: "integer", nullable: true })
    member_count?: number;

    @Column({ type: "varchar", nullable: true })
    member_type?: string;

    @Column({ type: "integer", nullable: true })
    member_id?: number;

    @Column({ type: "varchar", nullable: true })
    member_remote_id?: string;

    @Column({ type: "varchar", nullable: true })
    member_state?: string;

    @Column({ type: "varchar", nullable: true })
    member_causation?: string;

    @Column({ type: "json", nullable: true })
    etrunk_info?: any;

    @Column({ type: "json", nullable: true })
    members?: any[];
}

