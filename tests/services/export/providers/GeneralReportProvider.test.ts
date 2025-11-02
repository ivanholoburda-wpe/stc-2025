import * as xlsx from 'xlsx';
import {GeneralReportProvider} from "../../../../backend/src/services/export/providers/GeneralReportProvider";
import {IReportRepository} from "../../../../backend/src/repositories/ReportRepository";

const mockXlsxUtils = xlsx.utils as jest.Mocked<typeof xlsx.utils>;

const mockReportRepo: IReportRepository = {
    getDevicesForSnapshot: jest.fn(),
    findForSummary: jest.fn(),
    findWithInterfaces: jest.fn(),
    findWithRouting: jest.fn(),
    findWithProtocols: jest.fn(),
    findWithHardware: jest.fn(),
    findWithVpn: jest.fn(),
    findWithAlarms: jest.fn(),
    findWithL2: jest.fn(),
} as any;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GeneralReportProvider', () => {
    it('should have the correct reportId', () => {
        const provider = new GeneralReportProvider(mockReportRepo);
        expect(provider.reportId).toBe('per_device_details');
    });

    it('should process devices one by one to save memory', async () => {
        const snapshotId = 1;

        const mockDevicesList = [
            { id: 1, hostname: 'dev1' },
            { id: 2, hostname: 'dev2' }
        ];
        (mockReportRepo.getDevicesForSnapshot as jest.Mock).mockResolvedValue(mockDevicesList);

        const mockDevice1Data = { id: 1, hostname: 'dev1', model: 'M4', folder_name: 'dev1_folder', cpuSummaries: [{ system_cpu_use_rate_percent: 10 }] };
        const mockDevice2Data = { id: 2, hostname: 'dev2', model: 'M8', folder_name: 'dev2_folder', hardwareComponents: [{ slot: 1 }] };

        (mockReportRepo.findForSummary as jest.Mock).mockImplementation(async (id) => (id === 1 ? mockDevice1Data : mockDevice2Data));
        (mockReportRepo.findWithInterfaces as jest.Mock).mockResolvedValue({ interfaces: [] });
        (mockReportRepo.findWithRouting as jest.Mock).mockResolvedValue({ ipRoutes: [], arpRecords: [] });
        (mockReportRepo.findWithProtocols as jest.Mock).mockResolvedValue({ bgpPeers: [] });
        (mockReportRepo.findWithHardware as jest.Mock).mockResolvedValue({ hardwareComponents: [] });
        (mockReportRepo.findWithVpn as jest.Mock).mockResolvedValue({ mplsL2vcs: [], vpnInstances: [] });
        (mockReportRepo.findWithAlarms as jest.Mock).mockResolvedValue({ alarms: [] });
        (mockReportRepo.findWithL2 as jest.Mock).mockResolvedValue({ ethTrunks: [], vlans: [] });

        const provider = new GeneralReportProvider(mockReportRepo);
        await provider.generate(snapshotId);

        expect(mockReportRepo.getDevicesForSnapshot).toHaveBeenCalledWith(snapshotId);
        expect(mockReportRepo.findForSummary).toHaveBeenCalledTimes(2);
        expect(mockReportRepo.findForSummary).toHaveBeenCalledWith(1, snapshotId);
        expect(mockReportRepo.findForSummary).toHaveBeenCalledWith(2, snapshotId);
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledTimes(2); // Only summary sheets are created for this mock
    });
});
