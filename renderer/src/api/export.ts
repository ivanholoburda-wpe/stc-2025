import {APIResult} from "./types";

export interface ReportDefinition {
    id: string;
    label: string;
    description: string;
}

export interface ExportResult {
    success: boolean;
    path?: string;
    message?: string;
}

export async function getAvailableReports(): Promise<APIResult<ReportDefinition[]>> {
    if (window.electronAPI) {
        return window.electronAPI.getAvailableReports();
    }
    console.warn("electronAPI not found. Using mock reports.");
    return Promise.resolve({
        success: true,
        data: [
            { id: 'mock_report', label: 'Mock Report', description: 'This is a mock report for browser mode.' }
        ]
    });
}

export async function exportReport(reportId: string, snapshotId: number): Promise<ExportResult> {
    if (window.electronAPI) {
        return window.electronAPI.exportReport(reportId, snapshotId);
    }
    console.warn("electronAPI not found. Mocking export success.");
    return Promise.resolve({ success: true, path: "/mock/path/report.xlsx" });
}