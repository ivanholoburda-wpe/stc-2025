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
            { name: 'mode', value: 'offline' },
        ];

        for (const defaultOption of defaultOptions) {
            await this.optionRepository.updateOrCreate(defaultOption.name, defaultOption.value);
        }
    }
}
