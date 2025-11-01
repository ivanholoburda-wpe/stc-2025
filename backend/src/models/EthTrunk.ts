import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Device } from "./Device";
import { Snapshot } from "./Snapshot";

@Entity({ name: "eth_trunks" })
@Unique(["device", "snapshot", "trunk_id"])
export class EthTrunk {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @Column({ type: "integer" })
    trunk_id!: number;

    @Column({ type: "varchar", nullable: true })
    mode_type?: string;

    @Column({ type: "varchar", nullable: true })
    working_mode?: string;

    @Column({ type: "varchar", nullable: true })
    operating_status?: string;

    @Column({ type: "integer", nullable: true })
    number_of_up_ports?: number;

    @Column({ type: "json", nullable: true })
    local_info?: any;

    @Column({ type: "json", nullable: true })
    ports_info?: any;
}

