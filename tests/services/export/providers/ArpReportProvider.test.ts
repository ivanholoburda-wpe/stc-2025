import * as xlsx from 'xlsx';
import {ArpReportProvider} from "../../../../backend/src/services/export/providers/ArpReportProvider";
import {IReportRepository} from "../../../../backend/src/repositories/ReportRepository";

const mockXlsxUtils = xlsx.utils as jest.Mocked<typeof xlsx.utils>;

const mockReportRepo: IReportRepository = {
    getArpReportData: jest.fn(),
} as any;

beforeEach(() => {
    jest.clearAllMocks();
    (mockReportRepo.getArpReportData as jest.Mock).mockClear();
});

describe('ArpReportProvider', () => {
    it('should have the correct reportId', () => {
        const provider = new ArpReportProvider(mockReportRepo);
        expect(provider.reportId).toBe('full_arp_report');
    });

    it('should call getArpReportData and format data correctly', async () => {
        const snapshotId = 1;
        const mockData = [
            { device: { hostname: 'dev1' }, ip_address: '1.1.1.1', mac_address: 'aa:bb:cc', type: 'dynamic', interface: 'GE0/0/1', vlan: 10, vpn_instance: 'VPN-A' }
        ];
        (mockReportRepo.getArpReportData as jest.Mock).mockResolvedValue(mockData);

        const provider = new ArpReportProvider(mockReportRepo);
        await provider.generate(snapshotId);

        expect(mockReportRepo.getArpReportData).toHaveBeenCalledWith(snapshotId);

        expect(mockXlsxUtils.json_to_sheet).toHaveBeenCalledWith([
            {
                'Hostname': 'dev1',
                'IP Address': '1.1.1.1',
                'MAC Address': 'aa:bb:cc',
                'Type': 'dynamic',
                'Interface': 'GE0/0/1',
                'VLAN': 10,
                'VPN Instance': 'VPN-A'
            }
        ]);

        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Full ARP Table');
    });
});
