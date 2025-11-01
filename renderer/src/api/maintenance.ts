import { APIResult } from './types';

export async function clearData(): Promise<APIResult<{ message?: string }>> {
    if (window.electronAPI) {
        return window.electronAPI.clearData();
    }

    console.warn('electronAPI not found. Skipping data clearing.');
    return Promise.resolve({
        success: false,
        error: 'Maintenance actions are unavailable outside of the desktop application.',
    });
}

export async function backupData(): Promise<APIResult<{ path: string }>> {
    if (window.electronAPI) {
        return window.electronAPI.backupData();
    }

    console.warn('electronAPI not found. Skipping backup.');
    return Promise.resolve({
        success: false,
        error: 'Maintenance actions are unavailable outside of the desktop application.',
    });
}

export async function restoreData(): Promise<APIResult<{ message?: string }>> {
    if (window.electronAPI) {
        return window.electronAPI.restoreData();
    }

    console.warn('electronAPI not found. Skipping restore.');
    return Promise.resolve({
        success: false,
        error: 'Maintenance actions are unavailable outside of the desktop application.',
    });
}