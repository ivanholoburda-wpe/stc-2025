import * as xlsx from 'xlsx';
import {
    TransceiverInventoryReportProvider
} from "../../../../backend/src/services/export/providers/TransceiverInventoryReportProvider";
import {IReportRepository} from "../../../../backend/src/repositories/ReportRepository";

const mockXlsxUtils = xlsx.utils as jest.Mocked<typeof xlsx.utils>;

const mockReportRepo: IReportRepository = { getTransceiverInventoryData: jest.fn() } as any;

beforeEach(() => jest.clearAllMocks());

describe('TransceiverInventoryReportProvider', () => {
    it('should have the correct reportId', () => {
        const provider = new TransceiverInventoryReportProvider(mockReportRepo);
        expect(provider.reportId).toBe('transceiver_inventory_report');
    });

    it('should call getTransceiverInventoryData and format data', async () => {
        const snapshotId = 1;
        const mockData = [
            { device: { hostname: 'dev1' }, interface: { name: 'GE0/0/1' }, type: 'SFP+', vendor_pn: 'PN123', serial_number: 'SN123', wavelength: 1310, rx_power: -5, tx_power: 1, status: 'online' }
        ];
        (mockReportRepo.getTransceiverInventoryData as jest.Mock).mockResolvedValue(mockData);

        const provider = new TransceiverInventoryReportProvider(mockReportRepo);
        await provider.generate(snapshotId);

        expect(mockReportRepo.getTransceiverInventoryData).toHaveBeenCalledWith(snapshotId);
        expect(mockXlsxUtils.json_to_sheet).toHaveBeenCalledWith([
            { 'Hostname': 'dev1', 'Interface': 'GE0/0/1', 'Type': 'SFP+', 'Vendor P/N': 'PN123', 'Vendor S/N': 'SN123', 'Wavelength (nm)': 1310, 'Rx Power (dBm)': -5, 'Tx Power (dBm)': 1, 'Status': 'online' }
        ]);
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Transceiver Inventory');
    });
});
