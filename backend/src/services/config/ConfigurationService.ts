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
}

@injectable()
export class ConfigurationService implements IConfigurationService {
    constructor(
        @inject(TYPES.OptionRepository) private optionRepository: IOptionRepository
    ) {}

    public async isOfflineMode(): Promise<boolean> {
        const option = await this.optionRepository.findByOptionName('mode');
        const modeValue = option ? option.option_value : 'online';
        return modeValue === 'offline';
    }

    public async getAiModelKey(): Promise<string | null> {
        const option = await this.optionRepository.findByOptionName('ai_model_key');
        return option ? option.option_value : null;
    }

    public async setOfflineMode(isOffline: boolean): Promise<void> {
        const modeValue = isOffline ? 'offline' : 'online';
        await this.optionRepository.updateOrCreate('mode', modeValue);
    }

    public async setAiModelKey(key: string): Promise<void> {
        await this.optionRepository.updateOrCreate('ai_model_key', key);
    }

    public async getAiPromptStart(): Promise<string | null> {
        const option = await this.optionRepository.findByOptionName('ai_prompt_start');
        return option ? option.option_value : null;
    }

    public async setAiPromptStart(prompt: string): Promise<void> {
        await this.optionRepository.updateOrCreate('ai_prompt_start', prompt);
    }
}