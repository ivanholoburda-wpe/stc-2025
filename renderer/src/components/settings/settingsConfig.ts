import { formatLabelFromKey } from '../../utils/stringFormat';

export interface SettingConfig {
    label: string;
    description?: string;
    options?: string[];
    optionDisplayNames?: Record<string, string>;
}

export const settingsConfig: Record<string, SettingConfig> = {
    'mode': {
        label: 'Network Mode',
        description: 'Controls whether the application operates in online or offline mode',
        options: ['online', 'offline']
    },
    'ai_model_key': {
        label: 'AI Model API Key',
        description: 'API key for accessing AI services'
    },
    'ai_prompt_start': {
        label: 'AI Initial Prompt',
        description: 'This prompt will be used as the initial context for all AI requests'
    }
};

export function getSettingConfig(key: string): SettingConfig {
    return settingsConfig[key] || {
        label: formatLabelFromKey(key),
        description: undefined
    };
}