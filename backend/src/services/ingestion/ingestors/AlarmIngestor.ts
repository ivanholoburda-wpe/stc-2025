import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {IAlarmRepository} from "../../../repositories/AlarmRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class AlarmIngestor implements IIngestor {
    readonly blockType = "display_alarm_all_block";
    readonly priority = 40;

    constructor(
        @inject(TYPES.AlarmRepository) private alarmRepo: IAlarmRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const rows = Array.isArray(block?.alarms) ? block.alarms : [];
        if (rows.length === 0) {
            return;
        }

        const alarmsToInsert = rows.map(row => ({
            index: row.index,
            level: row.level,
            date: row.date,
            time: row.time,
            info: row.info,
            oid: row.oid,
            ent_code: row.ent_code,
            device: context.device,
            snapshot: context.snapshot,
        }));

        await this.alarmRepo.insertMany(alarmsToInsert);
        console.log(`[AlarmIngestor] Inserted ${alarmsToInsert.length} alarms.`);
    }
}