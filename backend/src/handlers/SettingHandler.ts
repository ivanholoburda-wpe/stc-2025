import { ipcMain } from 'electron';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { IOptionRepository } from '../repositories/OptionRepository';

@injectable()
export class SettingHandler {
    constructor(@inject(TYPES.OptionRepository) private optionRepository: IOptionRepository) {}

    register() {
        ipcMain.handle('config:get-settings', this.getSettings.bind(this));
        ipcMain.handle('config:set-network-mode', this.setNetworkMode.bind(this));
        ipcMain.handle('config:set-ai-model-key', this.setAiModelKey.bind(this));
        ipcMain.handle('config:set-ai-prompt-start', this.setAiPromptStart.bind(this));
    }

    private async getSettings() {
        const modeValue = await this.optionRepository.getOption('mode');
        const isOffline = modeValue === 'offline';
        const aiModelKey = (await this.optionRepository.getOption('ai_model_key')) || '';
        const aiPromptStart = (await this.optionRepository.getOption('ai_prompt_start')) || '';

        return { isOffline, aiModelKey, aiPromptStart };
    }

    private async setNetworkMode(_event: Electron.IpcMainInvokeEvent, isOffline: boolean) {
        const mode = isOffline ? 'offline' : 'online';
        await this.optionRepository.setOption('mode', mode);
    }

    private async setAiModelKey(_event: Electron.IpcMainInvokeEvent, modelKey: string) {
        await this.optionRepository.setOption('ai_model_key', modelKey);
    }

    private async setAiPromptStart(_event: Electron.IpcMainInvokeEvent, promptStart: string) {
        await this.optionRepository.setOption('ai_prompt_start', promptStart);
    }
}
