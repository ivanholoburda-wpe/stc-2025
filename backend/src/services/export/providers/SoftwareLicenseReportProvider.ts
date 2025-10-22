import { injectable, inject } from "inversify";
import * as xlsx from 'xlsx';
import { IReportProvider } from "./IReportProvider";
import { IReportRepository } from "../../../repositories/ReportRepository";
import { TYPES } from "../../../types";

@injectable()
export class SoftwareLicenseReportProvider implements IReportProvider {
    readonly reportId = 'software_license_report';

    constructor(
        @inject(TYPES.ReportRepository) private reportRepo: IReportRepository
    ) {}

    async generate(snapshotId: number): Promise<xlsx.WorkBook> {
        const devices = await this.reportRepo.getSoftwareLicenseData(snapshotId);

        const reportData = devices.map(device => {
            const license = device.licenseInfos?.[0];
            const patch = device.patchInfos?.[0];

            return {
                'Hostname': device.hostname,
                'Model': device.model,
                'License Product': license?.product_name,
                'License Version': license?.product_version,
                'License State': license?.state,
                'License S/N': license?.serial_no,
                'Patch Exists': patch?.patch_exists,
                'Patch Package Name': patch?.package_name,
                'Patch Version': patch?.package_version,
            };
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(reportData);

        ws['!cols'] = [
            { wch: 25 },
            { wch: 25 },
            { wch: 25 },
            { wch: 20 },
            { wch: 15 },
            { wch: 25 },
            { wch: 15 },
            { wch: 30 },
            { wch: 20 },
        ];

        xlsx.utils.book_append_sheet(wb, ws, 'Software & License Audit');
        return wb;
    }
}