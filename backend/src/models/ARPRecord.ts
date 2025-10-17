import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { Snapshot } from "./Snapshot"
import { Device } from "./Device"

@Entity({ name: "arp_records" })
export class ARPRecord {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar" })
    ip_address!: string;

    @Column({ type: "varchar" })
    mac_address!: string;

    @Column({ type: "int", nullable: true })
    expire_m?: number;

    @Column({ type: "varchar" })
    type?: string;

    @Column({ type: "varchar", nullable: true })
    interface?: string;

    @Column({ type: "varchar", nullable: true })
    vpn_instance?: string;

    @Column({ type: "varchar", nullable: true })
    vlan?: number;

    @Column({ type: "varchar", nullable: true })
    cevlan?: string;

    @ManyToOne(() => Device, (device) => device.alarms)
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @ManyToOne(() => Snapshot, (snapshot) => snapshot.alarms)
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;
}