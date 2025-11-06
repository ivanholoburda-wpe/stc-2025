import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { InventoryDaughterBoard } from "../models/InventoryDaughterBoard";
import { TYPES } from "../types";

export interface IInventoryDaughterBoardRepository {
    upsert(boards: Partial<InventoryDaughterBoard>[]): Promise<void>;
    findByDeviceAndSnapshot(deviceId: number, snapshotId: number): Promise<InventoryDaughterBoard[]>;
}

@injectable()
export class InventoryDaughterBoardRepository implements IInventoryDaughterBoardRepository {
    private repository: Repository<InventoryDaughterBoard>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(InventoryDaughterBoard);
    }

    async upsert(boards: Partial<InventoryDaughterBoard>[]): Promise<void> {
        if (boards.length === 0) {
            return;
        }

        await this.repository.upsert(
            boards,
            ['device', 'snapshot', 'slot_number', 'sub_slot']
        );
    }

    async findByDeviceAndSnapshot(deviceId: number, snapshotId: number): Promise<InventoryDaughterBoard[]> {
        return this.repository
            .createQueryBuilder("board")
            .where("board.device_id = :deviceId", { deviceId })
            .andWhere("board.snapshot_id = :snapshotId", { snapshotId })
            .orderBy("board.slot_number", "ASC")
            .addOrderBy("board.sub_slot", "ASC")
            .getMany();
    }
}

