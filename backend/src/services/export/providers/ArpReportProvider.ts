import { injectable, inject } from "inversify";
import * as xlsx from 'xlsx';
import { IReportProvider } from "./IReportProvider";
import { IReportRepository } from "../../../repositories/ReportRepository";
import { TYPES } from "../../../types";

@injectable()
export class ArpReportProvider implements IReportProvider {
    readonly reportId = 'full_arp_report';

    constructor(
        @inject(TYPES.ReportRepository) private reportRepo: IReportRepository
    ) {}

    async generate(snapshotId: number): Promise<xlsx.WorkBook> {
        const arpRecords = await this.reportRepo.getArpReportData(snapshotId);

        const reportData = arpRecords.map(record => ({
            'Hostname': record.device?.hostname,
            'IP Address': record.ip_address,
            'MAC Address': record.mac_address,
            'Type': record.type,
            'Interface': record.interface,
            'VLAN': record.vlan,
            'VPN Instance': record.vpn_instance,
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(reportData);

        ws['!cols'] = [
            { wch: 25 },
            { wch: 20 },
            { wch: 20 },
            { wch: 15 },
            { wch: 25 },
            { wch: 10 },
            { wch: 20 },
        ];

        xlsx.utils.book_append_sheet(wb, ws, 'Full ARP Table');
        return wb;
    }
}