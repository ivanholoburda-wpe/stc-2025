
import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { Alarm } from "../models/Alarm";
import { TYPES } from "../types";

export interface IAlarmRepository {
    insertMany(alarms: Partial<Alarm>[]): Promise<void>;
}

@injectable()
export class AlarmRepository implements IAlarmRepository {
    private repository: Repository<Alarm>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(Alarm);
    }

    async insertMany(alarms: Partial<Alarm>[]): Promise<void> {
        if (alarms.length === 0) return;

        await this.repository.insert(alarms);
    }
}