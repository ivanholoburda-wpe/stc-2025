import * as xlsx from 'xlsx';
import {
    IpRoutePerDeviceReportProvider
} from "../../../../backend/src/services/export/providers/IpRoutePerDeviceReportProvider";
import {IReportRepository} from "../../../../backend/src/repositories/ReportRepository";

const mockXlsxUtils = xlsx.utils as jest.Mocked<typeof xlsx.utils>;

const mockReportRepo: IReportRepository = { getIpRoutesPerDevice: jest.fn() } as any;

beforeEach(() => jest.clearAllMocks());

describe('IpRoutePerDeviceReportProvider', () => {
    it('should have the correct reportId', () => {
        const provider = new IpRoutePerDeviceReportProvider(mockReportRepo);
        expect(provider.reportId).toBe('ip_route_per_device_report');
    });

    it('should create a separate sheet for each device', async () => {
        const snapshotId = 1;
        const mockData = [
            { hostname: 'dev1', ipRoutes: [{ id: 1, destination_mask: '0.0.0.0/0', interface: { name: 'NULL0' } }] },
            { hostname: 'dev2', ipRoutes: [{ id: 2, destination_mask: '1.1.1.0/24', interface: { name: 'GE0/0/1' } }] }
        ];
        (mockReportRepo.getIpRoutesPerDevice as jest.Mock).mockResolvedValue(mockData);

        const provider = new IpRoutePerDeviceReportProvider(mockReportRepo);
        await provider.generate(snapshotId);

        expect(mockReportRepo.getIpRoutesPerDevice).toHaveBeenCalledWith(snapshotId);

        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledTimes(2);
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'dev1');
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'dev2');
    });
});
