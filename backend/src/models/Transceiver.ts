import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { Interface } from "./Interface"
import { Snapshot } from "./Snapshot"
import { Device } from "./Device"

@Entity({ name: "transceivers" })
export class Transceiver {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar" })
    name!: string;

    @ManyToOne(() => Interface, (iface) => iface.transceivers)
    @JoinColumn({ name: "interface_id" })
    interface!: Interface;

    @ManyToOne(() => Snapshot, (snapshot) => snapshot.transceivers)
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Device, (device) => device.transceivers)
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @Column({ type: "varchar", nullable: true })
    serial_number?: string;

    @Column({ type: "float", nullable: true })
    wavelength?: number;

    @Column({ type: "float", nullable: true })
    tx_power?: number;

    @Column({ type: "float", nullable: true })
    rx_power?: number;

    @Column({ type: "float", nullable: true })
    tx_warning_min?: number;

    @Column({ type: "float", nullable: true })
    tx_warning_max?: number;

    @Column({ type: "float", nullable: true })
    rx_warning_min?: number;

    @Column({ type: "float", nullable: true })
    rx_warning_max?: number;
}