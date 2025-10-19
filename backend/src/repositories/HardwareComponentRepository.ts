import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { HardwareComponent } from "../models/HardwareComponent";
import { TYPES } from "../types";

export interface IHardwareComponentRepository {
    upsert(components: Partial<HardwareComponent>[]): Promise<void>;
}

@injectable()
export class HardwareComponentRepository implements IHardwareComponentRepository {
    private repository: Repository<HardwareComponent>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(HardwareComponent);
    }

    async upsert(components: Partial<HardwareComponent>[]): Promise<void> {
        if (components.length === 0) {
            return;
        }
        await this.repository.upsert(components, ['device', 'snapshot', 'slot']);
    }
}