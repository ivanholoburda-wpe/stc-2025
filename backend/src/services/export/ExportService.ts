import * as xlsx from 'xlsx';
import { injectable, multiInject } from 'inversify';
import {IReportProvider, ReportDefinition} from "./providers/IReportProvider";
import { TYPES } from '../../types';
import { REPORT_REGISTRY } from "./reportRegistry";

export interface IExportService {
    getAvailableReports(): ReportDefinition[];
    exportReport(reportId: string, snapshotId: number, filePath: string): Promise<void>;
}

@injectable()
export class ExportService implements IExportService {
    private readonly providerMap: Map<string, IReportProvider>;

    constructor(
        @multiInject(TYPES.IReportProvider) providers: IReportProvider[]
    ) {
        this.providerMap = new Map(providers.map(p => [p.reportId, p]));
    }

    getAvailableReports(): ReportDefinition[] {
        return REPORT_REGISTRY;
    }

    async exportReport(reportId: string, snapshotId: number, filePath: string): Promise<void> {
        console.log(`[ExportService] Starting report generation for reportId='${reportId}'`);

        const provider = this.providerMap.get(reportId);
        if (!provider) {
            throw new Error(`Report provider for ID '${reportId}' not found.`);
        }

        const workbook = await provider.generate(snapshotId as any);

        xlsx.writeFile(workbook, filePath);

        console.log(`[ExportService] Report successfully saved to ${filePath}`);
    }
}

