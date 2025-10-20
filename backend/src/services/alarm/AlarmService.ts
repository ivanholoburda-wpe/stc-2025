import {inject, injectable} from "inversify";
import {TYPES} from "../../types";
import {IAlarmRepository} from "../../repositories/AlarmRepository";
import {Alarm} from "../../models/Alarm";

@injectable()
export class AlarmService {
    constructor(
        @inject(TYPES.AlarmRepository) private alarmRepository: IAlarmRepository,
    ) {
    }

    public async getAlarms(snapshotId: number): Promise<Alarm[]> {
        return await this.alarmRepository.getAllBySnapshot(snapshotId);
    }
}