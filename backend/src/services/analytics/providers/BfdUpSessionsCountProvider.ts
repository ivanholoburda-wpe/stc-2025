import { injectable, inject } from "inversify";
import { IMetricProvider, TimeSeriesDataPoint } from "./IMetricProvider";
import {TYPES} from "../../../types";
import {IAnalyticsRepository} from "../../../repositories/AnalyticsRepository";


@injectable()
export class BfdUpSessionsCountProvider implements IMetricProvider {
    readonly metricId = 'bfd.up_sessions_count';

    constructor(
        @inject(TYPES.AnalyticsRepository) private analyticsRepo: IAnalyticsRepository
    ) {}

    getTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]> {
        return this.analyticsRepo.getUpBfdSessionsCountTimeSeries(deviceId);
    }
}