import * as xlsx from 'xlsx';
import {IgpReportProvider} from "../../../../backend/src/services/export/providers/IgpReportProvider";
import {IReportRepository} from "../../../../backend/src/repositories/ReportRepository";

const mockXlsxUtils = xlsx.utils as jest.Mocked<typeof xlsx.utils>;

const mockReportRepo: IReportRepository = { getIgpReportData: jest.fn() } as any;

beforeEach(() => jest.clearAllMocks());

describe('IgpReportProvider', () => {
    it('should have the correct reportId', () => {
        const provider = new IgpReportProvider(mockReportRepo);
        expect(provider.reportId).toBe('igp_details_report');
    });

    it('should call getIgpReportData and merge OSPF and IS-IS data', async () => {
        const snapshotId = 1;
        const mockData = [
            {
                hostname: 'dev1', model: 'M4',
                ospfInterfaceDetails: [{ interface: { name: 'GE0/0/1', ip_address: '1.1.1.1' }, ip_address: '1.1.1.1', state: 'P-2-P', cost: 10, type: 'P2P', hello_timer: 10, dead_timer: 40, retransmit_timer: 5, hello_in: 1, hello_out: 1, dbd_in: 1, dbd_out: 1, lsr_in: 1, lsr_out: 1, lsu_in: 1, lsu_out: 1, lsack_in: 1, lsack_out: 1 }],
                isisPeers: [{ interface: { name: 'GE0/0/2', ip_address: '2.2.2.2' }, system_id: 'dev2', type: 'L2', priority: 64, process_id: 1, circuit_id: '01', state: 'Up', hold_time: 20 }]
            }
        ];
        (mockReportRepo.getIgpReportData as jest.Mock).mockResolvedValue(mockData);

        const provider = new IgpReportProvider(mockReportRepo);
        await provider.generate(snapshotId);

        expect(mockReportRepo.getIgpReportData).toHaveBeenCalledWith(snapshotId);

        const callData = mockXlsxUtils.json_to_sheet.mock.calls[0][0];
        expect(callData).toHaveLength(2);
        expect(callData[0]).toHaveProperty('IGP Protocol', 'OSPF');
        expect(callData[1]).toHaveProperty('IGP Protocol', 'IS-IS');
        expect(callData[0]).toHaveProperty('Interface IP/Mask', '1.1.1.1');
        expect(callData[1]).toHaveProperty('Interface IP/Mask', '2.2.2.2');
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'IGP Report');
    });
});
