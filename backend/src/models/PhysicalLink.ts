import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Snapshot } from "./Snapshot";
import { Interface } from "./Interface";

@Entity({ name: "physical_links" })
@Unique(["snapshot", "source_interface", "target_interface"])
export class PhysicalLink {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Snapshot, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "snapshot_id" })
    snapshot!: Snapshot;

    @ManyToOne(() => Interface, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "source_interface_id" })
    source_interface!: Interface;

    @ManyToOne(() => Interface, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "target_interface_id" })
    target_interface!: Interface;
}