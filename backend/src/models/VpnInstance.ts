import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "vpn_instances" })
@Unique(["name", "address_family", "device", "snapshot"])
export class VpnInstance {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @Column({ type: "varchar" })
    name!: string;

    @Column({ type: "varchar", nullable: true })
    rd?: string;

    @Column({ type: "varchar" })
    address_family!: string;
}