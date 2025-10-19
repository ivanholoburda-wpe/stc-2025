import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Interface } from "./Interface";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "isis_peers" })
@Unique(["interface", "system_id", "type", "device", "snapshot"])
export class IsisPeer {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Interface, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "interface_id" })
    interface!: Interface;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @Column({ type: "integer" })
    process_id!: number;

    @Column({ type: "varchar" })
    system_id!: string;

    @Column({ type: "varchar", nullable: true })
    circuit_id?: string;

    @Column({ type: "varchar" })
    state!: string;

    @Column({ type: "integer" })
    hold_time!: number;

    @Column({ type: "varchar" })
    type!: string;

    @Column({ type: "integer" })
    priority!: number;
}