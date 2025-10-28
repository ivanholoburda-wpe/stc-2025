import { injectable, inject } from "inversify";
import { IConfigurationService } from "../services/config/ConfigurationService";
import { TYPES } from "../types";

@injectable()
export class ConfigurationHandler {
    constructor(
        @inject(TYPES.ConfigurationService) private configService: IConfigurationService
    ) {}



    async getAllOptionsWithTypes() {
        try {
            const options = await this.configService.getAllOptionsWithTypes();
            return { success: true, data: options };
        } catch (error) {
            console.error('[ConfigurationHandler] getAllOptionsWithTypes failed', error);
            return { success: false, error: (error as Error).message };
        }
    }

    async updateOptions(options: Record<string, string>) {
        try {
            const promises = Object.entries(options).map(([key, value]) =>
                this.configService.setOption(key, value)
            );
            await Promise.all(promises);
            return { success: true };
        } catch (error) {
            console.error('[ConfigurationHandler] updateOptions failed', error);
            return { success: false, error: (error as Error).message };
        }
    }

    async isOfflineMode() {
        try {
            const mode = await this.configService.getOption('mode', 'offline');
            return { success: true, data: mode === 'offline' };
        } catch (error) {
            console.error('[ConfigurationHandler] isOfflineMode failed', error);
            return { success: false, error: (error as Error).message };
        }
    }
}
