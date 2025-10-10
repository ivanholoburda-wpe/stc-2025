import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"

@Entity({ name: "options" })
export class Option {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar" })
    option_name!: string;

    @Column({ type: "varchar", nullable: true })
    option_value!: string;
}