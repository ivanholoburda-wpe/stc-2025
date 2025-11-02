import * as xlsx from 'xlsx';
import {DownPortsReportProvider} from "../../../../backend/src/services/export/providers/DownPortsReportProvider";
import {IReportRepository} from "../../../../backend/src/repositories/ReportRepository";

const mockXlsxUtils = xlsx.utils as jest.Mocked<typeof xlsx.utils>;

const mockReportRepo: IReportRepository = { getDownPortsData: jest.fn() } as any;

beforeEach(() => jest.clearAllMocks());

describe('DownPortsReportProvider', () => {
    it('should have the correct reportId', () => {
        const provider = new DownPortsReportProvider(mockReportRepo);
        expect(provider.reportId).toBe('down_ports_report');
    });

    it('should call getDownPortsData and format data', async () => {
        const snapshotId = 1;
        const mockData = [
            { device: { hostname: 'dev1' }, name: 'GE0/0/2', phy_status: 'down', protocol_status: 'down', description: 'Port 2' }
        ];
        (mockReportRepo.getDownPortsData as jest.Mock).mockResolvedValue(mockData);

        const provider = new DownPortsReportProvider(mockReportRepo);
        await provider.generate(snapshotId);

        expect(mockReportRepo.getDownPortsData).toHaveBeenCalledWith(snapshotId);
        expect(mockXlsxUtils.json_to_sheet).toHaveBeenCalledWith([
            { 'Hostname': 'dev1', 'Interface': 'GE0/0/2', 'Status': 'down', 'Protocol': 'down', 'Description': 'Port 2' }
        ]);
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Down & Unused Ports');
    });
});
