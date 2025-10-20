import {inject, injectable} from "inversify";
import {Alarm} from "../models/Alarm";
import {AlarmRepository} from "../repositories/AlarmRepository";
import {TYPES} from "../types";

@injectable()
export class AlarmsHandler {
    constructor(
        @inject(TYPES.AlarmRepository) private alarmRepository: AlarmRepository) {

    }

    public async getAllBySnapshot(snapshotId: number) {
        try {
            const alarms: Alarm[] = await this.alarmRepository.getAllBySnapshot(snapshotId);
            return {
                success: true,
                data: alarms,
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            }
        }
    }
}