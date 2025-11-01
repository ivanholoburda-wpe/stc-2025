import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Interface } from "./Interface";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "ip_routes" })
@Unique(["destination_mask", "next_hop", "interface", "device", "snapshot"])
export class IpRoute {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Interface, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: "interface_id" })
    interface?: Interface | null;

    @Column({ type: "varchar" })
    destination_mask!: string;

    @Column({ type: "varchar" })
    protocol!: string;

    @Column({ type: "integer" })
    preference!: number;

    @Column({ type: "integer" })
    cost!: number;

    @Column({ type: "varchar" })
    flags!: string;

    @Column({ type: "varchar" })
    next_hop!: string;

    @Column({ type: "varchar", nullable: true })
    status?: string;

    @Column({ type: "varchar", nullable: true })
    network?: string;

    @Column({ type: "integer", nullable: true })
    prefix_len?: number;

    @Column({ type: "integer", nullable: true })
    loc_prf?: number;

    @Column({ type: "varchar", nullable: true })
    med?: string;

    @Column({ type: "integer", nullable: true })
    pref_val?: number;

    @Column({ type: "varchar", nullable: true })
    path_ogn?: string;

    @Column({ type: "integer", nullable: true })
    label?: number;

    @Column({ type: "varchar", nullable: true })
    route_distinguisher?: string;

    @Column({ type: "varchar", nullable: true })
    vpn_instance?: string;
}