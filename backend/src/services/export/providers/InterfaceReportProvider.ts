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

        const neighborMap = new Map<number, { neighborDevice: string; neighborInterface: string }>();
        for (const link of physicalLinks) {
            const s = link.source_interface;
            const t = link.target_interface;
            if (s?.device && t?.device) {
                neighborMap.set(s.id, { neighborDevice: t.device.hostname, neighborInterface: t.name });
                neighborMap.set(t.id, { neighborDevice: s.device.hostname, neighborInterface: t.name });
            }
        }

        const reportData = interfaces.map((iface) => {
            const transceiver = iface.transceivers?.[0];
            const neighbor = neighborMap.get(iface.id);
            return {
                'Sysname': iface.device?.hostname,
                'Port': iface.name,
                'Status': iface.phy_status,
                'TxWarningRange': `${transceiver?.tx_warning_min ?? ''}, ${transceiver?.tx_warning_max ?? ''}`,
                'RxWarningRange': `${transceiver?.rx_warning_min ?? ''}, ${transceiver?.rx_warning_max ?? ''}`,
                'TxLvl': transceiver?.tx_power,
                'RxLvl': transceiver?.rx_power,
                'Tx': transceiver?.tx_power ? 'OK' : 'NOT OK',
                'Rx': transceiver?.rx_power ? 'OK' : 'NOT OK',
                'NeighborDevice': neighbor?.neighborDevice,
            };
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(reportData);
        xlsx.utils.book_append_sheet(wb, ws, 'Interface Configurations');
        return wb;
    }
}