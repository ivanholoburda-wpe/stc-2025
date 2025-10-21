import * as xlsx from 'xlsx';

export interface ReportDefinition {
    id: string;
    label: string;
    description: string;
}

export interface IReportProvider {
    readonly reportId: string;

    generate(snapshotId: number): Promise<xlsx.WorkBook>;
}
