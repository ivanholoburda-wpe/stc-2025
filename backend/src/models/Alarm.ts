import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm"
import { Device } from "./Device"
import { Snapshot } from "./Snapshot"

@Entity({ name: "alarms" })
export class Alarm {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    index!: number;

    @Column()
    level!: string;

    @Column({ type: "date", default: () => "CURRENT_TIMESTAMP" })
    date!: Date;

    @Column()
    time!: string;

    @Column()
    info!: string;

    @Column()
    oid!: string;

    @Column()
    ent_code!: number;

    @ManyToOne(() => Device, (device) => device.alarms)
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @ManyToOne(() => Snapshot, (snapshot) => snapshot.alarms)
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;
}
