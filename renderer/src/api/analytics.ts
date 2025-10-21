import { APIResult } from "./types";

export interface Metric {
    id: string;
    label: string;
    category: string;
    unit?: string;
    description: string;
}


export interface TimeSeriesDataPoint {
    time: string;
    value: number;
}

export async function getAvailableMetrics(): Promise<APIResult<Metric[]>> {
    if (window.electronAPI) {
        return window.electronAPI.getAvailableMetrics();
    }
    console.warn("electronAPI not found. Using mock metrics.");
    return Promise.resolve({ success: true, data: [] });
}

export async function getTimeSeries(
    metricId: string,
    deviceId: number,
    options?: { interfaceName?: string }
): Promise<APIResult<TimeSeriesDataPoint[]>> {
    if (window.electronAPI) {
        return window.electronAPI.getTimeSeries(metricId, deviceId, options);
    }
    console.warn("electronAPI not found. Using mock time series data.");
    return Promise.resolve({ success: true, data: [] });
}
