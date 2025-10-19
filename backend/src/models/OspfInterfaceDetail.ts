import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Interface } from "./Interface";
import { Snapshot } from "./Snapshot";
import { Device } from "./Device";

@Entity({ name: "ospf_interface_details" })
@Unique(["interface", "device", "snapshot"])
export class OspfInterfaceDetail {
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

    @Column({ type: "varchar" })
    ip_address!: string;

    @Column({ type: "integer" })
    cost!: number;

    @Column({ type: "varchar" })
    state!: string;

    @Column({ type: "varchar" })
    type!: string;

    @Column({ type: "integer" })
    hello_timer!: number;

    @Column({ type: "integer" })
    dead_timer!: number;

    @Column({ type: "integer" })
    retransmit_timer!: number;

    @Column({ type: "integer", nullable: true })
    bfd_tx_interval?: number;

    @Column({ type: "integer", nullable: true })
    bfd_rx_interval?: number;

    @Column({ type: "integer", nullable: true })
    bfd_multiplier?: number;

    @Column({ type: "integer" })
    hello_in!: number;

    @Column({ type: "integer" })
    hello_out!: number;

    @Column({ type: "integer" })
    dbd_in!: number;

    @Column({ type: "integer" })
    dbd_out!: number;

    @Column({ type: "integer" })
    lsr_in!: number;

    @Column({ type: "integer" })
    lsr_out!: number;

    @Column({ type: "integer" })
    lsu_in!: number;

    @Column({ type: "integer" })
    lsu_out!: number;

    @Column({ type: "integer" })
    lsack_in!: number;

    @Column({ type: "integer" })
    lsack_out!: number;
}