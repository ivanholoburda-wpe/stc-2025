import * as xlsx from 'xlsx';
import {
    SoftwareLicenseReportProvider
} from "../../../../backend/src/services/export/providers/SoftwareLicenseReportProvider";
import {IReportRepository} from "../../../../backend/src/repositories/ReportRepository";

const mockXlsxUtils = xlsx.utils as jest.Mocked<typeof xlsx.utils>;

const mockReportRepo: IReportRepository = { getSoftwareLicenseData: jest.fn() } as any;

beforeEach(() => jest.clearAllMocks());

describe('SoftwareLicenseReportProvider', () => {
    it('should have the correct reportId', () => {
        const provider = new SoftwareLicenseReportProvider(mockReportRepo);
        expect(provider.reportId).toBe('software_license_report');
    });

    it('should call getSoftwareLicenseData and format data', async () => {
        const snapshotId = 1;
        const mockData = [
            { hostname: 'dev1', model: 'M4', licenseInfos: [{ product_name: 'NE8000', product_version: 'V1', state: 'Normal', serial_no: 'LIC123' }], patchInfos: [{ patch_exists: true, package_name: 'patch.pat', package_version: 'V1.1' }] }
        ];
        (mockReportRepo.getSoftwareLicenseData as jest.Mock).mockResolvedValue(mockData);

        const provider = new SoftwareLicenseReportProvider(mockReportRepo);
        await provider.generate(snapshotId);

        expect(mockReportRepo.getSoftwareLicenseData).toHaveBeenCalledWith(snapshotId);
        expect(mockXlsxUtils.json_to_sheet).toHaveBeenCalledWith([
            { 'Hostname': 'dev1', 'Model': 'M4', 'License Product': 'NE8000', 'License Version': 'V1', 'License State': 'Normal', 'License S/N': 'LIC123', 'Patch Exists': true, 'Patch Package Name': 'patch.pat', 'Patch Version': 'V1.1' }
        ]);
        expect(mockXlsxUtils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Software & License Audit');
    });
});
