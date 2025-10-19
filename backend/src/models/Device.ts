import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm"
import { Snapshot } from "./Snapshot"
import { Interface } from "./Interface"
import { Transceiver } from "./Transceiver"
import { DeviceNeighbor } from "./DeviceNeighbor"
import { Alarm } from "./Alarm"

@Entity({ name: "devices" })
export class Device {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar" })
    hostname!: string;

    @Column({ type: "varchar", nullable: true })
    model?: string;

    @ManyToOne(() => Snapshot, (snapshot: Snapshot) => snapshot.devices)
    @JoinColumn({ name: "first_seen_snapshot_id" })
    firstSeenSnapshot!: Snapshot;

    @OneToMany(() => Interface, (iface: Interface) => iface.device)
    interfaces?: Interface[];

    @OneToMany(() => Transceiver, (transceiver: Transceiver) => transceiver.device)
    transceivers?: Transceiver[];

    @OneToMany(() => DeviceNeighbor, (neighbor: DeviceNeighbor) => neighbor.firstDevice)
    firstDeviceNeighbors?: DeviceNeighbor[];

    @OneToMany(() => DeviceNeighbor, (neighbor: DeviceNeighbor) => neighbor.secondDevice)
    secondDeviceNeighbors?: DeviceNeighbor[];

    @OneToMany(() => Alarm, (alarm: Alarm) => alarm.device)
    alarms?: Alarm[];
}