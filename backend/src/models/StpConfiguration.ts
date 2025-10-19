import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "stp_configurations" })
@Unique(["device", "snapshot"])
export class StpConfiguration {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Snapshot)
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Device)
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @Column({ type: "varchar", nullable: true })
    protocol_status?: string;

    @Column({ type: "varchar", nullable: true })
    protocol_standard?: string;

    @Column({ type: "integer", nullable: true })
    version?: number;

    @Column({ type: "integer", nullable: true })
    cist_bridge_priority?: number;

    @Column({ type: "varchar", nullable: true })
    mac_address?: string;

    @Column({ type: "integer", nullable: true })
    max_age?: number;

    @Column({ type: "integer", nullable: true })
    forward_delay?: number;

    @Column({ type: "integer", nullable: true })
    hello_time?: number;

    @Column({ type: "integer", nullable: true })
    max_hops?: number;
}