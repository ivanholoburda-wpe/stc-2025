import React, { useState, useEffect, useCallback } from 'react';
import { getAllOptionsWithTypes, updateOptions } from '../../api/options';
import { OptionWithType } from '../../api/types';
import { SettingField } from '../settings/SettingField';
import { getSettingConfig } from '../settings/settingsConfig';

export function SettingsView() {
    const [options, setOptions] = useState<OptionWithType[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOptions = async () => {
            setLoading(true);
            try {
                const result = await getAllOptionsWithTypes();
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
        setOptions(prev => prev.map(opt =>
            opt.option_name === key
                ? { ...opt, option_value: value }
                : opt
        ));
    }, []);

    const handleSave = useCallback(async () => {
        setError('');
        setStatusMessage('');

        const optionsToSend = options.reduce((acc, opt) => {
            acc[opt.option_name] = opt.option_value;
            return acc;
        }, {} as Record<string, string>);

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
                {options.map((option) => {
                    const config = getSettingConfig(option.option_name);

                    return (
                        <SettingField
                            key={option.option_name}
                            type={option.option_type}
                            optionKey={option.option_name}
                            value={option.option_value}
                            onChange={handleOptionChange}
                            label={config.label}
                            description={config.description}
                            options={config.options}
                            optionDisplayNames={config.optionDisplayNames}
                        />
                    );
                })}
            </div>

            <div className="mt-8 flex items-center space-x-4">
                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                    Save Settings
                </button>
                {statusMessage && (
                    <span className={`text-sm ${statusMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                        {statusMessage}
                    </span>
                )}
            </div>
        </div>
    );
}
