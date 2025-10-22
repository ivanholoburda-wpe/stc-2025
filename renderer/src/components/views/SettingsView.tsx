import React, { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../../api/settings';

export function SettingsView() {
    const [isOnline, setIsOnline] = useState(true);
    const [aiModelKey, setAiModelKey] = useState('');
    const [aiPromptStart, setAiPromptStart] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        settingsApi.getSettings().then(settings => {
            setIsOnline(!settings.isOffline);
            setAiModelKey(settings.aiModelKey || '');
            setAiPromptStart(settings.aiPromptStart || '');
            setLoading(false);
        }).catch(error => {
            console.error('Failed to load settings:', error);
            setLoading(false);
        });
    }, []);

    const handleSave = useCallback(async () => {
        try {
            await settingsApi.setNetworkMode(!isOnline);
            await settingsApi.setAiModelKey(aiModelKey);
            await settingsApi.setAiPromptStart(aiPromptStart);
            setStatusMessage('Settings saved successfully!');
            setTimeout(() => setStatusMessage(''), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            setStatusMessage('Error saving settings.');
            setTimeout(() => setStatusMessage(''), 3000);
        }
    }, [isOnline, aiModelKey, aiPromptStart]);

    if (loading) {
        return (
            <div className="p-6 bg-gray-900 text-gray-100 h-full flex items-center justify-center">
                <div className="text-gray-400">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-900 text-gray-100 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold mb-6 text-white">Settings</h1>

            <div className="space-y-6 max-w-3xl">
                {/* Network Mode Setting */}
                <div className="p-5 border border-gray-700 rounded-lg bg-gray-800">
                    <h2 className="text-lg font-semibold mb-3 text-gray-200">Network Mode</h2>
                    <div className="flex items-center space-x-4">
                        <label htmlFor="network-toggle" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="network-toggle"
                                    className="sr-only"
                                    checked={isOnline}
                                    onChange={() => setIsOnline(!isOnline)}
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${isOnline ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isOnline ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-gray-300 font-medium">
                                {isOnline ? 'Online' : 'Offline'} Mode
                            </div>
                        </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                        {isOnline
                            ? 'The application is connected to the network and can access external resources.'
                            : 'In offline mode, the application will not attempt to access external resources.'
                        }
                    </p>
                </div>

                {/* AI Settings */}
                <div className="p-5 border border-gray-700 rounded-lg bg-gray-800">
                    <h2 className="text-lg font-semibold mb-4 text-gray-200">AI Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="aiModelKey" className="block text-sm font-medium text-gray-300 mb-2">
                                AI Model API Key
                            </label>
                            <input
                                type="password"
                                id="aiModelKey"
                                value={aiModelKey}
                                onChange={(e) => setAiModelKey(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your API key"
                            />
                        </div>
                        <div>
                            <label htmlFor="aiPromptStart" className="block text-sm font-medium text-gray-300 mb-2">
                                AI Initial Prompt
                            </label>
                            <textarea
                                id="aiPromptStart"
                                rows={5}
                                value={aiPromptStart}
                                onChange={(e) => setAiPromptStart(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Describe the context for analytics..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This prompt will be used as the initial context for all AI requests
                            </p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleSave}
                        className="px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
                    >
                        Save Changes
                    </button>
                    {statusMessage && (
                        <p className={`text-sm font-medium ${statusMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                            {statusMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
