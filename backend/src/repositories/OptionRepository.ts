import { injectable, inject } from "inversify";
import { DataSource, Repository } from "typeorm";
import { Option, OptionType } from "../models/Option";
import { TYPES } from "../types";

export interface IOptionRepository {
    findByOptionName(option_name: string): Promise<Option | null>;
    updateOrCreate(option_name: string, option_value: string, option_type?: OptionType): Promise<Option>;
    findAll(): Promise<Option[]>
}

@injectable()
export class OptionRepository implements IOptionRepository {
    private repository: Repository<Option>;

    constructor(@inject(TYPES.DataSource) private dataSource: DataSource) {
        this.repository = dataSource.getRepository(Option);
    }
    
    async findByOptionName(option_name: string): Promise<Option | null> {
        return await this.repository.findOne({
            where: {
                option_name
            }
        })
    }

    async updateOrCreate(option_name: string, option_value: string, option_type?: OptionType): Promise<Option> {
        let option = await this.findByOptionName(option_name);

        if (option) {
            option.option_value = option_value;
            if (option_type !== undefined) {
                option.option_type = option_type;
            }
        } else {
            option = this.repository.create({
                option_name,
                option_value,
                option_type: option_type || OptionType.TEXT
            });
        }

        return await this.repository.save(option);
    }

    async findAll(): Promise<Option[]> {
        return await this.repository.find();
    }
}