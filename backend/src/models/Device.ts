import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm"
import { Snapshot } from "./Snapshot"
import { Interface } from "./Interface"
import { Transceiver } from "./Transceiver"
import { DeviceNeighbor } from "./DeviceNeighbor"

@Entity({ name: "devices" })
export class Device {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", unique: true })
    hostname!: string;

    @Column({ type: "varchar", nullable: true })
    model?: string;

    @ManyToOne(() => Snapshot, (snapshot) => snapshot.devices)
    @JoinColumn({ name: "first_seen_snapshot_id" })
    firstSeenSnapshot!: Snapshot;

    @OneToMany(() => Interface, (iface) => iface.device)
    interfaces?: Interface[];

    @OneToMany(() => Transceiver, (transceiver) => transceiver.device)
    transceivers?: Transceiver[];

    @OneToMany(() => DeviceNeighbor, (neighbor) => neighbor.firstDevice)
    firstDeviceNeighbors?: DeviceNeighbor[];

    @OneToMany(() => DeviceNeighbor, (neighbor) => neighbor.secondDevice)
    secondDeviceNeighbors?: DeviceNeighbor[];
}