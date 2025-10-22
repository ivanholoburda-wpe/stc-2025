import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { IConfigurationService } from '../services/config/ConfigurationService';

@injectable()
export class SettingHandler {
    constructor(
        @inject(TYPES.ConfigurationService) private configService: IConfigurationService
    ) {}

    async getSettings() {
        const isOffline = await this.configService.isOfflineMode();
        const aiModelKey = (await this.configService.getAiModelKey()) || '';
        const aiPromptStart = (await this.configService.getAiPromptStart()) || '';

        return { isOffline, aiModelKey, aiPromptStart };
    }

    async setNetworkMode(isOffline: boolean) {
        await this.configService.setOfflineMode(isOffline);
    }
}
