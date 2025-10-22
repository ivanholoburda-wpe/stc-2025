import { injectable, inject } from "inversify";
import * as xlsx from 'xlsx';
import { IReportProvider } from "./IReportProvider";
import { IReportRepository } from "../../../repositories/ReportRepository";
import { TYPES } from "../../../types";

@injectable()
export class TransceiverInventoryReportProvider implements IReportProvider {
    readonly reportId = 'transceiver_inventory_report';

    constructor(
        @inject(TYPES.ReportRepository) private reportRepo: IReportRepository
    ) {}

    async generate(snapshotId: number): Promise<xlsx.WorkBook> {
        const transceivers = await this.reportRepo.getTransceiverInventoryData(snapshotId);

        const reportData = transceivers.map(trx => ({
            'Hostname': trx.device?.hostname,
            'Interface': trx.interface?.name,
            'Type': trx.type,
            'Vendor P/N': trx.vendor_pn,
            'Vendor S/N': trx.serial_number,
            'Wavelength (nm)': trx.wavelength,
            'Rx Power (dBm)': trx.rx_power,
            'Tx Power (dBm)': trx.tx_power,
            'Status': trx.status,
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(reportData);

        ws['!cols'] = [
            { wch: 25 },
            { wch: 25 },
            { wch: 20 },
            { wch: 20 },
            { wch: 20 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
        ];

        xlsx.utils.book_append_sheet(wb, ws, 'Transceiver Inventory');
        return wb;
    }
}