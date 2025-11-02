import * as xlsx from 'xlsx';
import {
    PerDeviceInterfaceReportProvider
} from "../../../../backend/src/services/export/providers/PerDeviceInterfaceReportProvider";
import {IReportRepository} from "../../../../backend/src/repositories/ReportRepository";

const mockXlsxUtils = xlsx.utils as jest.Mocked<typeof xlsx.utils>;

const mockReportRepo: IReportRepository = { getPerDeviceReportData: jest.fn() } as any;

beforeEach(() => jest.clearAllMocks());

describe('PerDeviceInterfaceReportProvider', () => {
    it('should have the correct reportId', () => {
        const provider = new PerDeviceInterfaceReportProvider(mockReportRepo);
        expect(provider.reportId).toBe('per_device_interface_report');
    });

    it('should create a separate sheet for each device', async () => {
        const snapshotId = 1;
        const mockData = [
            { hostname: 'dev1', interfaces: [{ name: 'GE0/0/1', phy_status: 'up', protocol_status: 'up', description: 'desc1' }] },
            { hostname: 'dev2', interfaces: [{ name: 'GE0/0/2', phy_status: 'down', protocol_status: 'down', description: 'desc2' }] }
        ];
        (mockReportRepo.getPerDeviceReportData as jest.Mock).mockResolvedValue(mockData);

        const provider = new PerDeviceInterfaceReportProvider(mockReportRepo);
        await provider.generate(snapshotId);

        expect(mockReportRepo.getPerDeviceReportData).toHaveBeenCalledWith(snapshotId);
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledTimes(2);
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'dev1');
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'dev2');
    });
});
