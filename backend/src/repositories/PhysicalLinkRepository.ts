import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { PhysicalLink } from "../models/PhysicalLink";
import { TYPES } from "../types";

export interface IPhysicalLinkRepository {
    upsert(links: Partial<PhysicalLink>[]): Promise<void>;
    findForTopology(snapshotId: number): Promise<PhysicalLink[]>;
}

@injectable()
export class PhysicalLinkRepository implements IPhysicalLinkRepository {
    private repository: Repository<PhysicalLink>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(PhysicalLink);
    }

    async upsert(links: Partial<PhysicalLink>[]): Promise<void> {
        if (links.length === 0) {
            return;
        }

        await this.repository.upsert(
            links,
            ['snapshot', 'source_interface', 'target_interface']
        );
    }

    async findForTopology(snapshotId: number): Promise<PhysicalLink[]> {
        return this.repository.find({
            where: {
                snapshot: { id: snapshotId },
            },
            relations: {
                source_interface: {
                    device: true,
                },
                target_interface: {
                    device: true,
                },
            },
        });
    }
}