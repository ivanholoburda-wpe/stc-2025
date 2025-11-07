import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Device } from "./Device";
import { Snapshot } from "./Snapshot";

@Entity({ name: "inventory_daughter_boards" })
@Unique(["device", "snapshot", "slot_number", "sub_slot"])
export class InventoryDaughterBoard {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @Column({ type: "integer" })
    slot_number!: number;

    @Column({ type: "integer" })
    sub_slot!: number;

    @Column({ type: "varchar", nullable: true })
    boardtype?: string;

    @Column({ type: "varchar", nullable: true })
    barcode?: string;

    @Column({ type: "varchar", nullable: true })
    item?: string;

    @Column({ type: "varchar", nullable: true })
    description?: string;

    @Column({ type: "varchar", nullable: true })
    manufactured?: string;

    @Column({ type: "varchar", nullable: true })
    vendorname?: string;

    @Column({ type: "varchar", nullable: true })
    issuenumber?: string;

    @Column({ type: "varchar", nullable: true })
    cleicode?: string;

    @Column({ type: "varchar", nullable: true })
    bom?: string;
}

