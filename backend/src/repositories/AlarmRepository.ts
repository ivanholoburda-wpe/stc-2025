
import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { Alarm } from "../models/Alarm";
import { TYPES } from "../types";

export interface IAlarmRepository {
    insertMany(alarms: Partial<Alarm>[]): Promise<void>;
    getAllBySnapshot(snapshotId: number): Promise<Alarm[]>;
}

@injectable()
export class AlarmRepository implements IAlarmRepository {
    private repository: Repository<Alarm>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(Alarm);
    }

    public async insertMany(alarms: Partial<Alarm>[]): Promise<void> {
        if (alarms.length === 0) return;

        await this.repository.insert(alarms);
    }

    public async getAllBySnapshot(snapshotId: number): Promise<Alarm[]> {
        return this.repository.find({
            where: {
                snapshot: { id: snapshotId }
            },
            order: {
                date: 'DESC',
                time: 'DESC'
            }
        });
    }
}