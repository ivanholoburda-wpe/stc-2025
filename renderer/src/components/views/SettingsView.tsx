import React, { useState, useEffect, useCallback } from 'react';
import { getAllOptions, updateOptions } from '../../api/options';
import { AppOptions } from '../../api/options';

const TextInputSetting = ({
                              optionKey,
                              value,
                              onChange,
                              label,
                              placeholder,
                              description,
                              isPassword = false,
                              isTextArea = false
                          }: {
    optionKey: string;
    value: string;
    onChange: (key: string, value: string) => void;
    label: string;
    placeholder?: string;
    description?: string;
    isPassword?: boolean;
    isTextArea?: boolean;
}) => (
    <div className="p-5 border border-gray-700 rounded-lg bg-gray-800">
        <label htmlFor={optionKey} className="block text-sm font-medium text-gray-300 mb-2">
            {label}
        </label>
        {isTextArea ? (
            <textarea
                id={optionKey}
                rows={5}
                value={value}
                onChange={(e) => onChange(optionKey, e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder={placeholder}
            />
        ) : (
            <input
                type={isPassword ? "password" : "text"}
                id={optionKey}
                value={value}
                onChange={(e) => onChange(optionKey, e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={placeholder}
            />
        )}
        {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
    </div>
);

const ToggleSetting = ({
                           optionKey,
                           value,
                           onChange,
                           label,
                           descriptionOn,
                           descriptionOff
                       }: {
    optionKey: string;
    value: boolean;
    onChange: (key: string, value: string) => void;
    label: string;
    descriptionOn?: string;
    descriptionOff?: string;
}) => (
    <div className="p-5 border border-gray-700 rounded-lg bg-gray-800">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">{label}</h2>
        <div className="flex items-center space-x-4">
            <label htmlFor={optionKey} className="flex items-center cursor-pointer">
                <div className="relative">
                    <input
                        type="checkbox"
                        id={optionKey}
                        className="sr-only"
                        checked={value}
                        onChange={() => onChange(optionKey, !value ? 'online' : 'offline')}
                    />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${value ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${value ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3 text-gray-300 font-medium">
                    {value ? 'Online' : 'Offline'} Mode
                </div>
            </label>
        </div>
        <p className="text-sm text-gray-500 mt-3">
            {value ? descriptionOn : descriptionOff}
        </p>
    </div>
);

export function SettingsView() {
    const [options, setOptions] = useState<AppOptions>({});
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOptions = async () => {
            setLoading(true);
            try {
                const result = await getAllOptions();
                if (result.success && result.data) {
                    setOptions(result.data);
                } else {
                    setError(result.error || 'Failed to load settings.');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };
        fetchOptions();
    }, []);

    const handleOptionChange = useCallback((key: string, value: string) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleSave = useCallback(async () => {
        setError('');
        setStatusMessage('');

        const optionsToSend = { ...options };

        try {
            const result = await updateOptions(optionsToSend);
            if (result.success) {
                setStatusMessage('Settings saved successfully!');
            } else {
                setStatusMessage(`Error saving settings: ${result.error || 'Unknown error'}`);
            }
        } catch (err) {
            setStatusMessage(`Error saving settings: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setTimeout(() => setStatusMessage(''), 3000);
        }
    }, [options]);

    if (loading) {
        return (
            <div className="p-6 bg-gray-900 text-gray-100 h-full flex items-center justify-center">
                <div className="text-gray-400">Loading settings...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-gray-900 text-gray-100 h-full flex items-center justify-center">
                <div className="text-red-400">{error}</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-900 text-gray-100 h-full overflow-y-auto">
            <h1 className="text-2xl font-bold mb-6 text-white">Settings</h1>

            <div className="space-y-6 max-w-3xl">
                {Object.entries(options).map(([key, value]) => {
                    if (key === 'mode') {
                        return (
                            <ToggleSetting
                                key={key}
                                optionKey={key}
                                value={value === 'online'}
                                onChange={handleOptionChange}
                                label="Network Mode"
                                descriptionOn="The application is connected to the network and can access external resources."
                                descriptionOff="In offline mode, the application will not attempt to access external resources."
                            />
                        );
                    } else if (key === 'ai_model_key') {
                        return (
                            <TextInputSetting
                                key={key}
                                optionKey={key}
                                value={value}
                                onChange={handleOptionChange}
                                label="AI Model API Key"
                                placeholder="Enter your API key"
                                isPassword={true} // Ховаємо ключ
                            />
                        );
                    } else if (key === 'ai_prompt_start') {
                        return (
                            <TextInputSetting
                                key={key}
                                optionKey={key}
                                value={value}
                                onChange={handleOptionChange}
                                label="AI Initial Prompt"
                                placeholder="Describe the context for analytics..."
                                description="This prompt will be used as the initial context for all AI requests"
                                isTextArea={true}
                            />
                        );
                    } else {
                        return (
                            <TextInputSetting
                                key={key}
                                optionKey={key}
                                value={value}
                                onChange={handleOptionChange}
                                label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} // Робимо "красиве" ім'я
                            />
                        );
                    }
                })}

                <div className="flex items-center space-x-4 pt-4 border-t border-gray-700">
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
