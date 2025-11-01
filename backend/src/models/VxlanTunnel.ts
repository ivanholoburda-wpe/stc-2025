import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Device } from "./Device";
import { Snapshot } from "./Snapshot";

@Entity({ name: "vxlan_tunnels" })
@Unique(["device", "snapshot", "vpn_instance", "tunnel_id"])
export class VxlanTunnel {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @Column({ type: "varchar" })
    vpn_instance!: string;

    @Column({ type: "integer" })
    tunnel_id!: number;

    @Column({ type: "varchar" })
    source!: string;

    @Column({ type: "varchar" })
    destination!: string;

    @Column({ type: "varchar", nullable: true })
    state?: string;

    @Column({ type: "varchar", nullable: true })
    type?: string;

    @Column({ type: "varchar", nullable: true })
    uptime?: string;
}

