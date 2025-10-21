import { injectable, inject } from "inversify";
import * as xlsx from 'xlsx';
import { IReportProvider } from "./IReportProvider";
import { IReportRepository } from "../../../repositories/ReportRepository";
import { TYPES } from "../../../types";

@injectable()
export class DownPortsReportProvider implements IReportProvider {
    readonly reportId = 'down_ports_report';

    constructor(
        @inject(TYPES.ReportRepository) private reportRepo: IReportRepository
    ) {}

    async generate(snapshotId: number): Promise<xlsx.WorkBook> {
        const downInterfaces = await this.reportRepo.getDownPortsData(snapshotId);

        const reportData = downInterfaces.map(iface => ({
            'Hostname': iface.device?.hostname,
            'Interface': iface.name,
            'Status': iface.phy_status,
            'Protocol': iface.protocol_status,
            'Description': iface.description,
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(reportData);

        ws['!cols'] = [
            { wch: 25 },
            { wch: 25 },
            { wch: 20 },
            { wch: 20 },
            { wch: 50 },
        ];

        xlsx.utils.book_append_sheet(wb, ws, 'Down & Unused Ports');
        return wb;
    }
}