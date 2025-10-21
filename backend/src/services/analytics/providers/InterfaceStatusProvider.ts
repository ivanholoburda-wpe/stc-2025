import { injectable, inject } from "inversify";
import { IMetricProvider, TimeSeriesDataPoint } from "./IMetricProvider";
import {TYPES} from "../../../types";
import {IAnalyticsRepository} from "../../../repositories/AnalyticsRepository";

@injectable()
export class InterfaceStatusProvider implements IMetricProvider {
    readonly metricId = 'interfaces.status';

    constructor(
        @inject(TYPES.AnalyticsRepository) private analyticsRepo: IAnalyticsRepository
    ) {}

    getTimeSeries(deviceId: number, options?: { interfaceName?: string }): Promise<TimeSeriesDataPoint[]> {
        return this.analyticsRepo.getInterfaceStatusTimeSeries(deviceId, options?.interfaceName);
    }
}