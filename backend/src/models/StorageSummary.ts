import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "storage_summaries" })
@Unique(["device", "snapshot"])
export class StorageSummary {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @Column({ type: "integer" })
    total_kb!: number;

    @Column({ type: "integer" })
    free_kb!: number;

    @Column({ type: "float" })
    total_mb!: number;

    @Column({ type: "float" })
    free_mb!: number;
}