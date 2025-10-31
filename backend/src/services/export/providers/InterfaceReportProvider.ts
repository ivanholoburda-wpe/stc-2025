import { injectable, inject } from "inversify";
import * as xlsx from 'xlsx';
import { IReportRepository } from "../../../repositories/ReportRepository";
import { TYPES } from "../../../types";
import { IPhysicalLinkRepository } from "../../../repositories/PhysicalLinkRepository";
import {IReportProvider} from "./IReportProvider";

@injectable()
export class InterfaceReportProvider implements IReportProvider {
    readonly reportId = 'interface_details_report';

    constructor(
        @inject(TYPES.ReportRepository) private reportRepo: IReportRepository,
        @inject(TYPES.PhysicalLinkRepository) private linkRepo: IPhysicalLinkRepository
    ) {}

    async generate(snapshotId: number): Promise<xlsx.WorkBook> {
        const [interfaces, physicalLinks] = await Promise.all([
            this.reportRepo.getInterfaceReportData(snapshotId),
            this.linkRepo.findForTopology(snapshotId)
        ]);

        const rows = physicalLinks.map((link) => ({
            SnapshotId: snapshotId,
            SourceDevice: link.source_device_name,
            SourceInterface: link.source_interface_name,
            TargetDevice: link.target_device_name,
            TargetInterface: link.target_interface_name,
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(rows);
        xlsx.utils.book_append_sheet(wb, ws, 'Interface Configurations');
        return wb;
    }
}