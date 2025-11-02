import * as xlsx from 'xlsx';
import {
    HardwareInventoryReportProvider
} from "../../../../backend/src/services/export/providers/HardwareInventoryReportProvider";
import {IReportRepository} from "../../../../backend/src/repositories/ReportRepository";

const mockXlsxUtils = xlsx.utils as jest.Mocked<typeof xlsx.utils>;

const mockReportRepo: IReportRepository = { getHardwareInventoryData: jest.fn() } as any;

beforeEach(() => jest.clearAllMocks());

describe('HardwareInventoryReportProvider', () => {
    it('should have the correct reportId', () => {
        const provider = new HardwareInventoryReportProvider(mockReportRepo);
        expect(provider.reportId).toBe('hardware_inventory_report');
    });

    it('should call getHardwareInventoryData and format data', async () => {
        const snapshotId = 1;
        const mockData = [
            { device: { hostname: 'dev1' }, slot: 1, type: 'PIC', model: 'Model-X', status: 'Normal', role: 'OTHER' }
        ];
        (mockReportRepo.getHardwareInventoryData as jest.Mock).mockResolvedValue(mockData);

        const provider = new HardwareInventoryReportProvider(mockReportRepo);
        await provider.generate(snapshotId);

        expect(mockReportRepo.getHardwareInventoryData).toHaveBeenCalledWith(snapshotId);
        expect(mockXlsxUtils.json_to_sheet).toHaveBeenCalledWith([
            { 'Hostname': 'dev1', 'Slot': 1, 'Type': 'PIC', 'Model': 'Model-X', 'Status': 'Normal', 'Role': 'OTHER' }
        ]);
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Hardware Inventory');
    });
});
