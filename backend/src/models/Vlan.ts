import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Device } from "./Device";
import { Snapshot } from "./Snapshot";

@Entity({ name: "vlans" })
@Unique(["device", "snapshot", "vid"])
export class Vlan {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @Column({ type: "integer" })
    vid!: number;

    @Column({ type: "varchar", nullable: true })
    status?: string;

    @Column({ type: "varchar", nullable: true })
    property?: string;

    @Column({ type: "varchar", nullable: true })
    mac_learn?: string;

    @Column({ type: "varchar", nullable: true })
    statistics?: string;

    @Column({ type: "varchar", nullable: true })
    description?: string;
}

