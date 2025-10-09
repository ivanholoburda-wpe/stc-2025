import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm"
import { Snapshot } from "./Snapshot"
import { Device } from "./Device"
import { Transceiver } from "./Transceiver"

@Entity({ name: "interfaces" })
export class Interface {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar" })
    name!: string;

    @ManyToOne(() => Snapshot, (snapshot) => snapshot.interfaces)
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Device, (device) => device.interfaces)
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @Column({ type: "varchar", nullable: true })
    phy_status?: string;

    @Column({ type: "varchar", nullable: true })
    protocol_status?: string;

    @Column({ type: "varchar", nullable: true })
    description?: string;

    @Column({ type: "varchar", nullable: true })
    ip_address?: string;

    @Column({ type: "int", nullable: true })
    mtu?: number;

    @OneToMany(() => Transceiver, (transceiver) => transceiver.interface)
    transceivers?: Transceiver[];
}