import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { IConfigurationService } from '../services/config/ConfigurationService';

@injectable()
export class SettingHandler {
    constructor(
        @inject(TYPES.ConfigurationService) private configService: IConfigurationService
    ) {}

    async getSettings() {
        return await this.configService.getAllSettings();
    }

    async updateSetting(key: string, value: string) {
        await this.configService.setSetting(key, value);
    }
}
