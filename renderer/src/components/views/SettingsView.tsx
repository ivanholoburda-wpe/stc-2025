import React, { useState, useEffect, useCallback } from 'react';
import { getAllOptionsWithTypes, updateOptions } from '../../api/options';
import { OptionWithType } from '../../api/types';
import { clearData as requestClearData, backupData as requestBackupData, restoreData as requestRestoreData } from '../../api/maintenance';
import { SettingField } from '../settings/SettingField';
import { getSettingConfig } from '../settings/settingsConfig';

export function SettingsView() {
    const [options, setOptions] = useState<OptionWithType[]>([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [maintenanceAction, setMaintenanceAction] = useState<'clear' | 'backup' | 'restore' | null>(null);
    const [maintenanceMessage, setMaintenanceMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    const fetchOptions = useCallback(async (showSpinner = true) => {
        if (showSpinner) {
            setLoading(true);
        }
        setError('');
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
    }, []);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

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

    const handleClearData = useCallback(async () => {
        if (!window.confirm('This will permanently delete all stored data. Continue?')) {
            return;
        }

        setMaintenanceMessage(null);
        setMaintenanceAction('clear');

        try {
            const result = await requestClearData();
            if (result.success) {
                const message = result.data?.message || 'All data has been cleared successfully.';
                setMaintenanceMessage({ type: 'success', text: message });
                await fetchOptions(false);
            } else {
                setMaintenanceMessage({ type: 'error', text: result.error || 'Failed to clear data.' });
            }
        } catch (err) {
            setMaintenanceMessage({
                type: 'error',
                text: err instanceof Error ? err.message : 'Failed to clear data.',
            });
        } finally {
            setMaintenanceAction(null);
            setTimeout(() => setMaintenanceMessage(null), 4000);
        }
    }, [fetchOptions]);

    const handleBackupData = useCallback(async () => {
        setMaintenanceMessage(null);
        setMaintenanceAction('backup');

        try {
            const result = await requestBackupData();
            if (result.success && result.data?.path) {
                setMaintenanceMessage({ type: 'success', text: `Backup saved to ${result.data.path}` });
            } else if (result.error) {
                const isCancelled = result.error.toLowerCase().includes('cancel');
                setMaintenanceMessage({
                    type: isCancelled ? 'info' : 'error',
                    text: result.error,
                });
            } else {
                setMaintenanceMessage({ type: 'error', text: 'Failed to create backup.' });
            }
        } catch (err) {
            setMaintenanceMessage({
                type: 'error',
                text: err instanceof Error ? err.message : 'Failed to create backup.',
            });
        } finally {
            setMaintenanceAction(null);
            setTimeout(() => setMaintenanceMessage(null), 4000);
        }
    }, []);

    const handleRestoreData = useCallback(async () => {
        setMaintenanceMessage(null);
        setMaintenanceAction('restore');

        try {
            const result = await requestRestoreData();
            if (result.success) {
                const message = result.data?.message || 'Backup restored successfully.';
                setMaintenanceMessage({ type: 'success', text: message });
                await fetchOptions(false);
            } else if (result.error) {
                const isCancelled = result.error.toLowerCase().includes('cancel');
                setMaintenanceMessage({
                    type: isCancelled ? 'info' : 'error',
                    text: result.error,
                });
            } else {
                setMaintenanceMessage({ type: 'error', text: 'Failed to restore backup.' });
            }
        } catch (err) {
            setMaintenanceMessage({
                type: 'error',
                text: err instanceof Error ? err.message : 'Failed to restore backup.',
            });
        } finally {
            setMaintenanceAction(null);
            setTimeout(() => setMaintenanceMessage(null), 4000);
        }
    }, [fetchOptions]);

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
        <div className="p-6 bg-gray-900 text-gray-100 h-full overflow-y-auto custom-scrollbar">
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

            <div className="mt-12 border-t border-gray-800 pt-6">
                <h2 className="text-xl font-semibold text-white">Data Maintenance</h2>
                <p className="mt-2 text-sm text-gray-400">
                    Create a backup of your current database or clear all stored data.
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                    <button
                        onClick={handleBackupData}
                        disabled={maintenanceAction !== null}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {maintenanceAction === 'backup' ? 'Backing up…' : 'Backup Data'}
                    </button>
                    <button
                        onClick={handleRestoreData}
                        disabled={maintenanceAction !== null}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {maintenanceAction === 'restore' ? 'Restoring…' : 'Load Backup'}
                    </button>
                    <button
                        onClick={handleClearData}
                        disabled={maintenanceAction !== null}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {maintenanceAction === 'clear' ? 'Clearing…' : 'Clear Data'}
                    </button>
                </div>
                {maintenanceMessage && (
                    <div
                        className={`mt-4 text-sm ${
                            maintenanceMessage.type === 'success'
                                ? 'text-green-400'
                                : maintenanceMessage.type === 'info'
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                        }`}
                    >
                        {maintenanceMessage.text}
                    </div>
                )}
            </div>
        </div>
    );
}
