import { injectable, inject } from "inversify";
import { IMetricProvider, TimeSeriesDataPoint } from "./IMetricProvider";
import {TYPES} from "../../../types";
import {IAnalyticsRepository} from "../../../repositories/AnalyticsRepository";

@injectable()
export class TransceiverRxPowerProvider implements IMetricProvider {
    readonly metricId = 'transceiver.rx_power';

    constructor(
        @inject(TYPES.AnalyticsRepository) private analyticsRepo: IAnalyticsRepository
    ) {}

    getTimeSeries(deviceId: number, options?: { interfaceName?: string }): Promise<TimeSeriesDataPoint[]> {
        return this.analyticsRepo.getTransceiverRxPowerTimeSeries(deviceId, options?.interfaceName);
    }
}
