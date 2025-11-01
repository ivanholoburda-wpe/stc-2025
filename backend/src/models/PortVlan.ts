import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Device } from "./Device";
import { Snapshot } from "./Snapshot";
import { Interface } from "./Interface";

@Entity({ name: "port_vlans" })
@Unique(["device", "snapshot", "port_name"])
export class PortVlan {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Interface, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: "interface_id" })
    interface?: Interface | null;

    @Column({ type: "varchar" })
    port_name!: string;

    @Column({ type: "varchar", nullable: true })
    link_type?: string;

    @Column({ type: "integer", nullable: true })
    pvid?: number;

    @Column({ type: "varchar", nullable: true })
    vlan_list?: string;
}

