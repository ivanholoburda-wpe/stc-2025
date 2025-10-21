import { injectable, inject } from "inversify";
import * as xlsx from 'xlsx';
import { IReportProvider } from "./IReportProvider";
import { IReportRepository } from "../../../repositories/ReportRepository";
import { TYPES } from "../../../types";

@injectable()
export class PerDeviceInterfaceReportProvider implements IReportProvider {
    readonly reportId = 'per_device_interface_report';

    constructor(
        @inject(TYPES.ReportRepository) private reportRepo: IReportRepository
    ) {}

    async generate(snapshotId: number): Promise<xlsx.WorkBook> {
        const devices = await this.reportRepo.getPerDeviceReportData(snapshotId);

        const wb = xlsx.utils.book_new();

        for (const device of devices) {
            if (!device.interfaces || device.interfaces.length === 0) {
                continue;
            }

            const sheetData = device.interfaces.map(iface => ({
                'Interface': iface.name,
                'PHY': iface.phy_status,
                'Protocol': iface.protocol_status,
                'Description': iface.description,
            }));

            const ws = xlsx.utils.json_to_sheet(sheetData);

            ws['!cols'] = [
                { wch: 25 },
                { wch: 15 },
                { wch: 15 },
                { wch: 50 },
            ];

            const sheetName = device.hostname.substring(0, 31);
            xlsx.utils.book_append_sheet(wb, ws, sheetName);
        }

        return wb;
    }
}