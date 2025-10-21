type IPCResponse = {
    success: boolean;
    message: string;
    path?: string;
};

export const exportApi = {
    flatReport: (snapshotId: number): Promise<IPCResponse> => {
        return window.electronAPI.exportFlatReport(snapshotId);
    },
};