import {inject, injectable} from "inversify";
import {TYPES} from "../types";
import {AnalyticsService} from "../services/analytics/AnalyticsService";

@injectable()
export class AnalyticsHandler {
    constructor(
        @inject(TYPES.AnalyticsService) private analyticsService: AnalyticsService
    ) {
    }

    public async getAnalytics(metricId: string, deviceId: number, options?: { interfaceName?: string }) {
        try {
            const timeSeries = await this.analyticsService.getTimeSeries(metricId, deviceId, options);
            return {
                success: true,
                data: timeSeries,
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    public async getAvailableMetrics() {
        try {
            const availableMetrics = this.analyticsService.getAvailableMetrics();
            return {
                success: true,
                data: availableMetrics,
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }
}