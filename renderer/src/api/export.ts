
import { IPCResponse } from './types.d';

export const exportApi = {
    flatReport: (snapshotId: number): Promise<IPCResponse> => {
        return window.electronAPI.exportFlatReport(snapshotId);
    },
};