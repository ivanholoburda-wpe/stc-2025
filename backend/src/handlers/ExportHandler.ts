import { injectable, inject } from 'inversify';
import { dialog } from 'electron';
import { TYPES } from '../types';
import { IExportService } from '../services/export/ExportService';

export type IPCResponse = {
  success: boolean;
  message: string;
  path?: string;
};

@injectable()
export class ExportHandler {
  constructor(@inject(TYPES.ExportService) private readonly exportService: IExportService) {}

  async exportFlatReport(snapshotId: number): Promise<IPCResponse> {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Сохранить отчет',
      defaultPath: `network-report-${snapshotId}.xlsx`,
      filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Export cancelled.' };
    }

    try {
      await this.exportService.exportFlatReport(snapshotId, filePath);
      return { success: true, message: 'Export completed', path: filePath };
    } catch (e: any) {
      console.error('[ExportHandler] export failed', e);
      return { success: false, message: e?.message || 'Export failed' };
    }
  }
}
