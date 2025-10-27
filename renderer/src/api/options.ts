export type AppOptions = Record<string, string>;

import { APIResult, OptionWithType } from "./types";



export async function getAllOptionsWithTypes(): Promise<APIResult<OptionWithType[]>> {
    if (window.electronAPI) {
        return window.electronAPI.getAllOptionsWithTypes();
    }
    console.warn("electronAPI not found. Using mock options with types.");
    return Promise.resolve({
        success: true,
        data: [
            { id: 1, option_name: 'mode', option_value: 'offline', option_type: 'toggle' },
            { id: 2, option_name: 'ai_model_key', option_value: 'mock_key', option_type: 'secret' },
            { id: 3, option_name: 'ai_prompt_start', option_value: 'Default prompt', option_type: 'textarea' }
        ]
    });
}

export async function updateOptions(options: AppOptions): Promise<APIResult<void>> {
    if (window.electronAPI) {
        return window.electronAPI.updateOptions(options);
    }
    console.warn("electronAPI not found. Mocking options update success.");
    return Promise.resolve({ success: true });
}