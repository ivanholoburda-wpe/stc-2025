import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"

export enum OptionType {
    TOGGLE = 'toggle',
    TEXT = 'text',
    TEXTAREA = 'textarea',
    SECRET = 'secret',
    NUMBER = 'number',
    SELECT = 'select'
}

@Entity({ name: "options" })
export class Option {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar" })
    option_name!: string;

    @Column({ type: "varchar", nullable: true })
    option_value!: string;

    @Column({ type: "varchar", default: OptionType.TEXT })
    option_type!: OptionType;
}