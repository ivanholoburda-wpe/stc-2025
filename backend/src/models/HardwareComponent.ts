import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Device } from "./Device";
import { Snapshot } from "./Snapshot";

@Entity({ name: "hardware_components" })
@Unique(["device", "snapshot", "slot"])
export class HardwareComponent {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "device_id" })
    device!: Device;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @Column({ type: "integer" })
    slot!: number;

    @Column({ type: "varchar" })
    type!: string;

    @Column({ type: "varchar", nullable: true })
    model?: string;

    @Column({ type: "varchar", nullable: true })
    online_status?: string;

    @Column({ type: "varchar", nullable: true })
    register_status?: string;

    @Column({ type: "varchar", nullable: true })
    status?: string;

    @Column({ type: "varchar", nullable: true })
    role?: string;

    @Column({ type: "varchar", nullable: true })
    primary_status?: string;

    @Column({ type: "json", nullable: true })
    details?: any;

    // Inventory board information (for main boards)
    @Column({ type: "varchar", nullable: true })
    inventory_boardtype?: string;

    @Column({ type: "varchar", nullable: true })
    inventory_barcode?: string;

    @Column({ type: "varchar", nullable: true })
    inventory_item?: string;

    @Column({ type: "varchar", nullable: true })
    inventory_description?: string;

    @Column({ type: "varchar", nullable: true })
    inventory_manufactured?: string;

    @Column({ type: "varchar", nullable: true })
    inventory_vendorname?: string;

    @Column({ type: "varchar", nullable: true })
    inventory_issuenumber?: string;

    @Column({ type: "varchar", nullable: true })
    inventory_cleicode?: string;

    @Column({ type: "varchar", nullable: true })
    inventory_bom?: string;
}