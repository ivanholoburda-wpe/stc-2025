import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "license_info" })
@Unique(["device", "snapshot"])
export class LicenseInfo {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @Column({ type: "varchar", nullable: true })
    active_license_path?: string;

    @Column({ type: "varchar", nullable: true })
    state?: string;

    @Column({ type: "varchar", nullable: true })
    product_name?: string;

    @Column({ type: "varchar", nullable: true })
    product_version?: string;

    @Column({ type: "varchar", nullable: true })
    serial_no?: string;

    @Column({ type: "varchar", nullable: true })
    creator?: string;

    @Column({ type: "varchar", nullable: true })
    created_time?: string;
}