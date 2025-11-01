import {Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, Column} from "typeorm";
import { Snapshot } from "./Snapshot";

@Entity({ name: "physical_links" })
@Unique(["snapshot", "source_device_name", "source_interface_name", "target_device_name", "target_interface_name"])
export class PhysicalLink {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @Column({ name: "source_device_name" })
    source_device_name!: string;

    @Column({ name: "source_interface_name" })
    source_interface_name!: string;

    @Column({ name: "target_device_name" })
    target_device_name!: string;

    @Column({ name: "target_interface_name" })
    target_interface_name!: string;
}