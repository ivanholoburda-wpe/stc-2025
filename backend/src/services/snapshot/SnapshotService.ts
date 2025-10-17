import {Snapshot} from "../../models/Snapshot";
import {inject, injectable} from "inversify";
import {ISnapshotRepository} from "../../repositories/SnapshotRepository";
import {TYPES} from "../../types";

export interface ISnapshotService {
    getAllSnapshots(): Promise<Snapshot[]>;
}

@injectable()
export class SnapshotService implements ISnapshotService {
    constructor(
        @inject(TYPES.SnapshotRepository) private snapshotRepository: ISnapshotRepository
    ) {
    }

    public async getAllSnapshots(): Promise<Snapshot[]> {
        return await this.snapshotRepository.findAll();
    }
}