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
}