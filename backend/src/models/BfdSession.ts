import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Interface } from "./Interface";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "bfd_sessions" })
@Unique(["interface", "device", "snapshot"])
export class BfdSession {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Interface)
    @JoinColumn({ name: "interface_id" })
    interface!: Interface;

    @ManyToOne(() => Snapshot)
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Device)
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @Column({ type: "integer" })
    local_discriminator!: number;

    @Column({ type: "integer" })
    remote_discriminator!: number;

    @Column({ type: "varchar" })
    peer_ip_address!: string;

    @Column({ type: "varchar" })
    state!: string;

    @Column({ type: "varchar" })
    type!: string;
}