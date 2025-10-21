import { injectable, inject } from "inversify";
import * as xlsx from 'xlsx';
import { IReportProvider } from "./IReportProvider";
import { IReportRepository } from "../../../repositories/ReportRepository";
import { TYPES } from "../../../types";

@injectable()
export class IgpReportProvider implements IReportProvider {
    readonly reportId = 'igp_details_report';

    constructor(
        @inject(TYPES.ReportRepository) private reportRepo: IReportRepository
    ) {}

    async generate(snapshotId: number): Promise<xlsx.WorkBook> {
        const devices = await this.reportRepo.getIgpReportData(snapshotId);

        const reportData: any[] = [];

        for (const device of devices) {
            device.ospfInterfaceDetails?.forEach(ospf => {
                reportData.push({
                    'Device Name': device.hostname,
                    'Device Type': device.model,
                    'IGP Protocol': 'OSPF',
                    'Router ID': ospf.ip_address,
                    'IGP Area': ospf.state,
                    'Interface Name': ospf.interface.name,
                    'Interface Description': ospf.interface.description,
                    'Interface IP/Mask': ospf.interface.ip_address,
                    'IGP Cost': ospf.cost,
                    'State': ospf.state,
                    'Type': ospf.type,
                    'Hello Timer': ospf.hello_timer,
                    'Dead Timer': ospf.dead_timer,
                    'Retransmit Timer': ospf.retransmit_timer,
                    'BFD Tx Interval': ospf.bfd_tx_interval,
                    'BFD Rx Interval': ospf.bfd_rx_interval,
                    'BFD Multiplier': ospf.bfd_multiplier,
                    'Hello In': ospf.hello_in,
                    'Hello Out': ospf.hello_out,
                    'DBD In': ospf.dbd_in,
                    'DBD Out': ospf.dbd_out,
                    'LSR In': ospf.lsr_in,
                    'LSR Out': ospf.lsr_out,
                    'LSU In': ospf.lsu_in,
                    'LSU Out': ospf.lsu_out,
                    'LSACK In': ospf.lsack_in,
                    'LSACK Out': ospf.lsack_out,
                });
            });

            device.isisPeers?.forEach(isis => {
                reportData.push({
                    'Device Name': device.hostname,
                    'Device Type': device.model,
                    'IGP Protocol': 'IS-IS',
                    'Router ID': isis.system_id,
                    'IGP Area': isis.type,
                    'Interface Name': isis.interface.name,
                    'Interface Description': isis.interface.description,
                    'Interface IP/Mask': isis.interface.ip_address,
                    'IGP Cost': isis.priority,
                    'State': isis.state,
                    'Process ID': isis.process_id,
                    'Circuit ID': isis.circuit_id,
                    'Hold Time': isis.hold_time,
                    'Priority': isis.priority,
                });
            });
        }

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(reportData);
        xlsx.utils.book_append_sheet(wb, ws, 'IGP Report');
        return wb;
    }
}
