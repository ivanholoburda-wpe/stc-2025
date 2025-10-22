import { injectable, inject } from "inversify";
import * as xlsx from 'xlsx';
import { IReportProvider } from "./IReportProvider";
import { IReportRepository } from "../../../repositories/ReportRepository";
import { TYPES } from "../../../types";

@injectable()
export class IpRoutePerDeviceReportProvider implements IReportProvider {
    readonly reportId = 'ip_route_per_device_report';

    constructor(
        @inject(TYPES.ReportRepository) private reportRepo: IReportRepository
    ) {}

    async generate(snapshotId: number): Promise<xlsx.WorkBook> {
        const devices = await this.reportRepo.getIpRoutesPerDevice(snapshotId);

        const wb = xlsx.utils.book_new();

        for (const device of devices) {
            if (!device.ipRoutes || device.ipRoutes.length === 0) {
                continue;
            }

            const sheetData = device.ipRoutes.map(route => ({
                'Destination/Mask': route.destination_mask,
                'Protocol': route.protocol,
                'NextHop': route.next_hop,
                'Interface': route.interface?.name || 'N/A',
                'Preference': route.preference,
                'Cost': route.cost,
                'Flags': route.flags,
            }));

            const ws = xlsx.utils.json_to_sheet(sheetData);

            ws['!cols'] = [
                { wch: 22 },
                { wch: 15 },
                { wch: 20 },
                { wch: 25 },
                { wch: 10 },
                { wch: 10 },
                { wch: 10 },
            ];

            const sheetName = device.hostname.substring(0, 31);
            xlsx.utils.book_append_sheet(wb, ws, sheetName);
        }

        return wb;
    }
}