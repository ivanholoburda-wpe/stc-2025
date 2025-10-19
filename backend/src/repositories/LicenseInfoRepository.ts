import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { LicenseInfo } from "../models/LicenseInfo";
import { TYPES } from "../types";

export interface ILicenseInfoRepository {
    upsert(licenseInfo: Partial<LicenseInfo>): Promise<void>;
}

@injectable()
export class LicenseInfoRepository implements ILicenseInfoRepository {
    private repository: Repository<LicenseInfo>;

    constructor(@inject(TYPES.DataSource) dataSource: DataSource) {
        this.repository = dataSource.getRepository(LicenseInfo);
    }

    async upsert(licenseInfo: Partial<LicenseInfo>): Promise<void> {
        await this.repository.upsert(
            licenseInfo,
            ['device', 'snapshot']
        );
    }
}