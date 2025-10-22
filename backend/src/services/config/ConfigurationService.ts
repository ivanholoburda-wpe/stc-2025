import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { IOptionRepository } from "../../repositories/OptionRepository";

export interface IConfigurationService {
    isOfflineMode(): Promise<boolean>
    setOfflineMode(isOffline: boolean): Promise<void>;
    getAiModelKey(): Promise<string | null>
    setAiModelKey(key: string): Promise<void>;
    getAiPromptStart(): Promise<string | null>
    setAiPromptStart(prompt: string): Promise<void>
    getAllSettings(): Promise<{ isOffline: boolean; aiModelKey: string; aiPromptStart: string }>;
    setSetting(key: string, value: string): Promise<void>;
}

@injectable()
export class ConfigurationService implements IConfigurationService {
    private settingsCache: Map<string, string> = new Map();

    constructor(
        @inject(TYPES.OptionRepository) private optionRepository: IOptionRepository
    ) {}

    public async isOfflineMode(): Promise<boolean> {
        const modeValue = await this.getOptionValue('mode', 'online');
        return modeValue === 'offline';
    }

    public async getAiModelKey(): Promise<string | null> {
        return await this.getOptionValue('ai_model_key', null);
    }

    public async setOfflineMode(isOffline: boolean): Promise<void> {
        const modeValue = isOffline ? 'offline' : 'online';
        await this.optionRepository.updateOrCreate('mode', modeValue);
        this.settingsCache.set('mode', modeValue);
    }

    public async setAiModelKey(key: string): Promise<void> {
        await this.optionRepository.updateOrCreate('ai_model_key', key);
        this.settingsCache.set('ai_model_key', key);
    }

    public async getAiPromptStart(): Promise<string | null> {
        return await this.getOptionValue('ai_prompt_start', null);
    }

    public async setAiPromptStart(prompt: string): Promise<void> {
        await this.optionRepository.updateOrCreate('ai_prompt_start', prompt);
        this.settingsCache.set('ai_prompt_start', prompt);
    }

    public async getAllSettings(): Promise<{ isOffline: boolean; aiModelKey: string; aiPromptStart: string }> {
        const allOptions = await this.optionRepository.getAll();
        const settingsMap = new Map(allOptions.map(opt => [opt.option_name, opt.option_value]));

        settingsMap.forEach((value, key) => {
            this.settingsCache.set(key, value);
        });

        return {
            isOffline: settingsMap.get('mode') === 'offline',
            aiModelKey: settingsMap.get('ai_model_key') || '',
            aiPromptStart: settingsMap.get('ai_prompt_start') || ''
        };
    }

    public async setSetting(key: string, value: string): Promise<void> {
        await this.optionRepository.updateOrCreate(key, value);
        this.settingsCache.set(key, value);
    }

    private async getOptionValue(optionName: string, defaultValue: string | null): Promise<string | null> {
        if (this.settingsCache.has(optionName)) {
            return this.settingsCache.get(optionName)!;
        }

        const option = await this.optionRepository.findByOptionName(optionName);
        const value = option ? option.option_value : defaultValue;

        if (value !== null) {
            this.settingsCache.set(optionName, value);
        }

        return value;
    }
}