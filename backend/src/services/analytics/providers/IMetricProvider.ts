export interface TimeSeriesDataPoint {
    time: string;
    value: number;
}

export interface IMetricProvider {
    readonly metricId: string;
    getTimeSeries(deviceId: number, options?: { interfaceName?: string }): Promise<TimeSeriesDataPoint[]>;
}