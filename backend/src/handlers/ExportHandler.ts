import { injectable, inject } from 'inversify';
import { dialog } from 'electron';
import { IExportService } from "../services/export/ExportService";
import { TYPES } from "../types";

@injectable()
export class ExportHandler {
    constructor(
        @inject(TYPES.ExportService) private readonly exportService: IExportService
    ) {}

    async getAvailableReports() {
        try {
            const reports = this.exportService.getAvailableReports();
            return { success: true, data: reports };
        } catch (error) {
            console.error('[ExportHandler] getAvailableReports failed', error);
            return { success: false, error: (error as Error).message };
        }
    }

    async exportReport(reportId: string, snapshotId: number) {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Зберегти звіт',
            defaultPath: `${reportId}_${Date.now()}.xlsx`,
            filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
        });

        if (canceled || !filePath) {
            return { success: false, message: 'Export cancelled.' };
        }

        try {
            await this.exportService.exportReport(reportId, snapshotId, filePath);
            return { success: true, path: filePath };
        } catch (error) {
            console.error(`[ExportHandler] Export failed for report '${reportId}'`, error);
            return { success: false, message: (error as Error).message };
        }
    }
}

