import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { Device } from "./Device"
import { Interface } from "./Interface"
import { Transceiver } from "./Transceiver"
import { Alarm } from "./Alarm"

@Entity({ name: "snapshots" })
export class Snapshot {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;

    @Column({ type: "varchar" })
    root_folder_path!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @OneToMany(() => Device, (device: Device) => device.firstSeenSnapshot)
    devices?: Device[];

    @OneToMany(() => Interface, (iface: Interface) => iface.snapshot)
    interfaces?: Interface[];

    @OneToMany(() => Transceiver, (transceiver: Transceiver) => transceiver.snapshot)
    transceivers?: Transceiver[];

    @OneToMany(() => Alarm, (alarm: Alarm) => alarm.snapshot)
    alarms?: Alarm[];
}