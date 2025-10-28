import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { IOptionRepository } from "../../repositories/OptionRepository";
import { Option } from "../../models/Option";

export interface IConfigurationService {
    isOfflineMode(): Promise<boolean>
    getOption(optionName: string, defaultValue: string | null): Promise<string | null>
    setOption(optionName: string, value: string): Promise<void>
    getAllOptionsWithTypes(): Promise<Option[]>;
    getAiPromptStart(): Promise<string | null>;
    getAiModelKey(): Promise<string | null>;
}

@injectable()
export class ConfigurationService implements IConfigurationService {
    private settingsCache: Map<string, string> = new Map();

    constructor(
        @inject(TYPES.OptionRepository) private optionRepository: IOptionRepository
    ) {}

    public async isOfflineMode(): Promise<boolean> {
        const modeValue = await this.getOption('mode', 'offline');
        return modeValue === 'offline';
    }

    public async getAiPromptStart(): Promise<string | null> {
        return await this.getOption('ai_prompt_start', '');
    }

    public async getAiModelKey(): Promise<string | null> {
        return await this.getOption('ai_model_key', '');
    }

    public async getOption(optionName: string, defaultValue: string | null = null): Promise<string | null> {
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

    public async setOption(optionName: string, value: string): Promise<void> {
        await this.optionRepository.updateOrCreate(optionName, value);

        this.settingsCache.set(optionName, value);
    }

    public async getAllOptionsWithTypes(): Promise<Option[]> {
        return await this.optionRepository.findAll();
    }


}