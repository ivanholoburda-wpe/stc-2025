import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { InventoryPort } from "../models/InventoryPort";
import { TYPES } from "../types";

export interface IInventoryPortRepository {
    upsert(ports: Partial<InventoryPort>[]): Promise<void>;
    findByDeviceAndSnapshot(deviceId: number, snapshotId: number): Promise<InventoryPort[]>;
}

@injectable()
export class InventoryPortRepository implements IInventoryPortRepository {
    private repository: Repository<InventoryPort>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(InventoryPort);
    }

    async upsert(ports: Partial<InventoryPort>[]): Promise<void> {
        if (ports.length === 0) {
            return;
        }

        await this.repository.upsert(
            ports,
            ['device', 'snapshot', 'slot_number', 'sub_slot', 'port_number']
        );
    }

    async findByDeviceAndSnapshot(deviceId: number, snapshotId: number): Promise<InventoryPort[]> {
        return this.repository
            .createQueryBuilder("port")
            .where("port.device_id = :deviceId", { deviceId })
            .andWhere("port.snapshot_id = :snapshotId", { snapshotId })
            .orderBy("port.slot_number", "ASC")
            .addOrderBy("port.sub_slot", "ASC")
            .addOrderBy("port.port_number", "ASC")
            .getMany();
    }
}

