import {inject, injectable} from "inversify";
import {IOptionRepository} from "../../repositories/OptionRepository";
import {TYPES} from "../../types";
import {OptionType} from "../../models/Option";

@injectable()
export class DefaultOptionsSeeder {
    constructor(
        @inject(TYPES.OptionRepository) private optionRepository: IOptionRepository
    ) {}

    public async run(): Promise<void> {
        const defaultOptions = [
            { name: 'mode', value: 'online', type: OptionType.TOGGLE },
            { name: 'ai_prompt_start', value: "Imagine you're a senior networking engineer. Answer to the question, that user will ask. Here's the data about network state: ", type: OptionType.TEXTAREA },
            { name: 'ai_model_key', value: '', type: OptionType.SECRET },
        ];

        console.log('[Seeder] Checking default options...');
        for (const {name, value, type} of defaultOptions) {
            const existing = await this.optionRepository.findByOptionName(name);

            if (!existing) {
                await this.optionRepository.updateOrCreate(name, value, type);
                console.log(`[Seeder] Option '${name}' created with default value and type ${type}.`);
            } else {
                if (existing.option_type !== type) {
                    await this.optionRepository.updateOrCreate(name, existing.option_value, type);
                    console.log(`[Seeder] Option '${name}' type normalized to ${type}.`);
                } else {
                    console.log(`[Seeder] Option '${name}' already exists. Skipping.`);
                }
            }
        }
    }
}