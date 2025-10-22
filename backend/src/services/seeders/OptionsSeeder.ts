import { injectable, inject } from "inversify";
import { IOptionRepository } from "../../repositories/OptionRepository";
import { TYPES } from "../../types";

@injectable()
export class DefaultOptionsSeeder {
    constructor(
        @inject(TYPES.OptionRepository) private optionRepository: IOptionRepository
    ) {}

    public async run(): Promise<void> {
        const defaultOptions = [
            { name: 'mode', value: 'online' },
            { name: 'ai_prompt_start', value: "Imagine you're a senior networking engineer. Answer to the question, that user will ask. Here's the data about network state: " },
        ];

        console.log('[Seeder] Checking default options...');
        for (const defaultOption of defaultOptions) {
            const existingOption = await this.optionRepository.findByOptionName(defaultOption.name);

            if (!existingOption) {
                await this.optionRepository.updateOrCreate(defaultOption.name, defaultOption.value);
                console.log(`[Seeder] Option '${defaultOption.name}' created with default value.`);
            } else {
                console.log(`[Seeder] Option '${defaultOption.name}' already exists. Skipping.`);
            }
        }
    }
}
