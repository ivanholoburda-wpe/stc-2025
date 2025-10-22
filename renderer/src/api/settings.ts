export const settingsApi = {
    getSettings: async (): Promise<{ isOffline: boolean; aiModelKey: string; aiPromptStart: string }> => {
        return window.configAPI.getSettings();
    },
    updateSetting: async (key: string, value: string): Promise<void> => {
        return window.configAPI.updateSetting(key, value);
    },
};
