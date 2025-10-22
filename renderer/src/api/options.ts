export type AppOptions = Record<string, string>;

import { APIResult } from "./types";

export async function getAllOptions(): Promise<APIResult<AppOptions>> {
    if (window.electronAPI) {
        return window.electronAPI.getAllOptions();
    }
    console.warn("electronAPI not found. Using mock options.");
    return Promise.resolve({
        success: true,
        data: {
            'mode': 'offline',
            'ai_model_key': 'mock_key',
            'ai_prompt_start': 'Default prompt'
        }
    });
}

export async function updateOptions(options: AppOptions): Promise<APIResult<void>> {
    if (window.electronAPI) {
        return window.electronAPI.updateOptions(options);
    }
    console.warn("electronAPI not found. Mocking options update success.");
    return Promise.resolve({ success: true });
}