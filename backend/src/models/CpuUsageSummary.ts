import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "cpu_usage_summaries" })
@Unique(["device", "snapshot"])
export class CpuUsageSummary {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @Column({ type: "varchar" })
    timestamp!: string;

    @Column({ type: "integer" })
    system_cpu_use_rate_percent!: number;

    @Column({ type: "json" })
    cpu_avg!: { five_seconds: number; one_minute: number; five_minutes: number; };

    @Column({ type: "integer" })
    max_cpu_usage_percent!: number;

    @Column({ type: "varchar" })
    max_cpu_usage_time!: string;

    @Column({ type: "json" })
    service_details!: { service_name: string; use_rate_percent: number; }[];
}