import * as xlsx from 'xlsx';
import {
    NetworkHealthReportProvider
} from "../../../../backend/src/services/export/providers/NetworkHealthReportProvider";
import {IReportRepository, NetworkHealthData} from "../../../../backend/src/repositories/ReportRepository";

const mockXlsxUtils = xlsx.utils as jest.Mocked<typeof xlsx.utils>;

const mockReportRepo: IReportRepository = { getNetworkHealthData: jest.fn() } as any;

beforeEach(() => jest.clearAllMocks());

describe('NetworkHealthReportProvider', () => {
    it('should have the correct reportId', () => {
        const provider = new NetworkHealthReportProvider(mockReportRepo);
        expect(provider.reportId).toBe('network_health_report');
    });

    it('should call getNetworkHealthData and format percentages', async () => {
        const snapshotId = 1;
        const mockData: NetworkHealthData[] = [
            { hostname: 'dev1', model: 'M4', cpu_usage_percent: 10, free_storage_percent: 80.5123, critical_alarms_count: 1, down_bgp_peers_count: 0 }
        ];
        (mockReportRepo.getNetworkHealthData as jest.Mock).mockResolvedValue(mockData);

        const provider = new NetworkHealthReportProvider(mockReportRepo);
        await provider.generate(snapshotId);

        expect(mockReportRepo.getNetworkHealthData).toHaveBeenCalledWith(snapshotId);
        expect(mockXlsxUtils.json_to_sheet).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ 'Free Storage (%)': '80.51' })
            ])
        );
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Network Health');
    });
});
