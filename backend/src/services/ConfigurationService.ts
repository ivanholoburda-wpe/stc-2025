import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import { IOptionRepository } from "../repositories/OptionRepository";

export interface IConfigurationService {
    isOfflineMode(): Promise<boolean>
    getAiModelKey(): Promise<string | null>
    setOfflineMode(isOffline: boolean): Promise<void>;
    setAiModelKey(key: string): Promise<void>;
}

@injectable()
export class ConfigurationService implements IConfigurationService {
    private settingsCache: Map<string, string> = new Map();

    constructor(
        @inject(TYPES.OptionRepository) private optionRepository: IOptionRepository
    ) {}

    public async isOfflineMode(): Promise<boolean> {
        const modeValue = await this.getOptionValue('mode', 'offline');
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