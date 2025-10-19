import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "patch_info" })
@Unique(["device", "snapshot"])
export class PatchInfo {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @Column({ type: "boolean" })
    patch_exists!: boolean;

    @Column({ type: "varchar", nullable: true })
    package_name?: string;

    @Column({ type: "varchar", nullable: true })
    package_version?: string;

    @Column({ type: "varchar", nullable: true })
    state?: string;

    @Column({ type: "json", nullable: true })
    details?: any;
}