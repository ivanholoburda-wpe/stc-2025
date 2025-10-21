import { injectable, inject, multiInject } from "inversify";
import { TYPES } from "../../types";
import {IMetricProvider, TimeSeriesDataPoint} from "./providers/IMetricProvider";
import {METRIC_REGISTRY, MetricDefinition} from "./metricRegistry";

@injectable()
export class AnalyticsService {
    private readonly metricProviderMap: Map<string, IMetricProvider>;

    constructor(
        @multiInject(TYPES.IMetricProvider) providers: IMetricProvider[]
    ) {
        this.metricProviderMap = new Map(
            providers.map(provider => [provider.metricId, provider])
        );
    }

    getAvailableMetrics(): MetricDefinition[] {
        return METRIC_REGISTRY;
    }

    async getTimeSeries(metricId: string, deviceId: number, options?: { interfaceName?: string }): Promise<TimeSeriesDataPoint[]> {
        const provider = this.metricProviderMap.get(metricId);

        if (!provider) {
            throw new Error(`Metric provider for ID '${metricId}' not found.`);
        }

        return provider.getTimeSeries(deviceId, options);
    }
}

