import { injectable, inject } from "inversify";
import * as xlsx from 'xlsx';
import { IReportProvider } from "./IReportProvider";
import { IReportRepository } from "../../../repositories/ReportRepository";
import { TYPES } from "../../../types";

@injectable()
export class NetworkHealthReportProvider implements IReportProvider {
    readonly reportId = 'network_health_report';

    constructor(
        @inject(TYPES.ReportRepository) private reportRepo: IReportRepository
    ) {}

    async generate(snapshotId: number): Promise<xlsx.WorkBook> {
        const healthData = await this.reportRepo.getNetworkHealthData(snapshotId);

        const reportData = healthData.map(d => ({
            'Hostname': d.hostname,
            'Model': d.model,
            'CPU Usage (%)': d.cpu_usage_percent,
            'Free Storage (%)': d.free_storage_percent?.toFixed(2),
            'Critical Alarms': d.critical_alarms_count,
            'Down BGP Peers': d.down_bgp_peers_count,
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(reportData);

        ws['!cols'] = [
            { wch: 25 },
            { wch: 25 },
            { wch: 15 },
            { wch: 20 },
            { wch: 20 },
            { wch: 20 },
        ];

        xlsx.utils.book_append_sheet(wb, ws, 'Network Health');
        return wb;
    }
}