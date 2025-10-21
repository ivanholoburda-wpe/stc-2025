import { injectable, inject } from "inversify";
import * as xlsx from 'xlsx';
import { IReportProvider } from "./IReportProvider";
import { IReportRepository } from "../../../repositories/ReportRepository";
import { TYPES } from "../../../types";

@injectable()
export class HardwareInventoryReportProvider implements IReportProvider {
    readonly reportId = 'hardware_inventory_report';

    constructor(
        @inject(TYPES.ReportRepository) private reportRepo: IReportRepository
    ) {}

    async generate(snapshotId: number): Promise<xlsx.WorkBook> {
        const components = await this.reportRepo.getHardwareInventoryData(snapshotId);

        const reportData = components.map(comp => ({
            'Hostname': comp.device?.hostname,
            'Slot': comp.slot,
            'Type': comp.type,
            'Model': comp.model,
            'Status': comp.status,
            'Role': comp.role,
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(reportData);

        ws['!cols'] = [
            { wch: 25 },
            { wch: 10 },
            { wch: 15 },
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
        ];

        xlsx.utils.book_append_sheet(wb, ws, 'Hardware Inventory');
        return wb;
    }
}