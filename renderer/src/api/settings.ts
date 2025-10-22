export const settingsApi = {
    getSettings: async (): Promise<{ isOffline: boolean; aiModelKey: string; aiPromptStart: string }> => {
        return window.configAPI.getSettings();
    },
    setNetworkMode: async (isOffline: boolean): Promise<void> => {
        return window.configAPI.setNetworkMode(isOffline);
    },
    setAiModelKey: async (key: string): Promise<void> => {
        return window.configAPI.setAiModelKey(key);
    },
    setAiPromptStart: async (prompt: string): Promise<void> => {
        return window.configAPI.setAiPromptStart(prompt);
    },
};
