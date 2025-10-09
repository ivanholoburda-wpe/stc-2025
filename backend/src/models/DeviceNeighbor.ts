import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm"
import { Device } from "./Device"

@Entity({ name: "device_neighbors" })
export class DeviceNeighbor {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Device, (device) => device.firstDeviceNeighbors)
    @JoinColumn({ name: "first_device_id" })
    firstDevice!: Device;

    @ManyToOne(() => Device, (device) => device.secondDeviceNeighbors)
    @JoinColumn({ name: "second_device_id" })
    secondDevice!: Device;
}
