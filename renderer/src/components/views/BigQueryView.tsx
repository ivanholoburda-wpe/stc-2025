import React, { useMemo, useRef, useState } from 'react';
import { BigQueryExportOptions, BigQueryExportResult, exportDatabaseToBigQuery } from '../../api/export';

interface FormState {
    datasetId: string;
    tablePrefix: string;
    location: string;
    keyJson: string;
    truncateBeforeInsert: boolean;
    useCustomChunkSize: boolean;
    chunkSize: string;
}

const initialState: FormState = {
    datasetId: '',
    tablePrefix: '',
    location: '',
    keyJson: '',
    truncateBeforeInsert: true,
    useCustomChunkSize: false,
    chunkSize: '500',
};

export function BigQueryView() {
    const [form, setForm] = useState<FormState>(initialState);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BigQueryExportResult | null>(null);
    const [responseMeta, setResponseMeta] = useState<{ success: boolean; message: string } | null>(null);
    const [importedKeyFileName, setImportedKeyFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const datasetValidation = useMemo((): {
        isValid: boolean;
        message?: string;
        projectId?: string;
    } => {
        const trimmed = form.datasetId.trim();

        if (!trimmed) {
            return { isValid: false, message: 'Dataset ID is required.' };
        }

        const normalized = trimmed.replace(/:/g, '.');
        const segments = normalized.split('.');

        if (segments.length > 2 || segments.some((segment) => segment.length === 0)) {
            return { isValid: false, message: 'Use the format "dataset" or "project.dataset".' };
        }

        const datasetName = segments[segments.length - 1];

        if (!/^[A-Za-z_][A-Za-z0-9_]{0,1023}$/.test(datasetName)) {
            return {
                isValid: false,
                message: 'Dataset name must start with a letter or underscore and contain only letters, numbers, or underscores.',
            };
        }

        const projectId = segments.length === 2 ? segments[0] : undefined;

        return {
            isValid: true,
            projectId,
        };
    }, [form.datasetId]);

    const isDatasetIdValid = datasetValidation.isValid;
    const chunkSizeNumber = useMemo(() => {
        const parsed = Number(form.chunkSize);
        return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
    }, [form.chunkSize]);

    const handleInputChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleReset = () => {
        setForm(initialState);
        setError(null);
        setResult(null);
        setResponseMeta(null);
        setImportedKeyFileName(null);
    };

    const handleKeyFileImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleKeyFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const text = await file.text();
            setForm((prev) => ({
                ...prev,
                keyJson: text,
            }));
            setImportedKeyFileName(file.name);
            setError(null);
        } catch (fileError) {
            console.error('Failed to read service account key file.', fileError);
            setError('Failed to read the selected JSON key file. Please try again or paste the credentials manually.');
        } finally {
            event.target.value = '';
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!datasetValidation.isValid) {
            setError(datasetValidation.message ?? 'Dataset ID is required.');
            return;
        }

        setIsExporting(true);
        setError(null);
        setResult(null);
        setResponseMeta(null);

        const options: BigQueryExportOptions = {
            datasetId: form.datasetId.trim(),
            tablePrefix: form.tablePrefix.trim() || undefined,
            location: form.location.trim() || undefined,
            truncateBeforeInsert: form.truncateBeforeInsert,
        };

        if (form.keyJson.trim().length > 0) {
            options.credentials = {
                keyJson: form.keyJson.trim(),
            };
        }

        if (form.useCustomChunkSize && chunkSizeNumber) {
            options.chunkSize = chunkSizeNumber;
        }

        try {
            const response = await exportDatabaseToBigQuery(options);

            if (response.success && response.data) {
                setResult(response.data);
                setResponseMeta({ success: true, message: 'Export completed successfully.' });
            } else if (response.success && !response.data) {
                const message = 'Export completed but no details were returned.';
                setResponseMeta({ success: true, message });
            } else {
                const message = response.error || 'Export failed for an unknown reason.';
                setResponseMeta({ success: false, message });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unexpected error occurred during export.';
            setError(message);
            setResponseMeta({ success: false, message });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-6 bg-gray-900 text-gray-100 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">Export to BigQuery</h1>
                    <p className="text-sm text-gray-400">
                        Configure the destination dataset and optional credentials to export all tables to Google BigQuery.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg divide-y divide-gray-700">
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Dataset ID <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                className={`w-full px-4 py-2 rounded-lg bg-gray-900 border ${
                                    isDatasetIdValid ? 'border-gray-700 focus:border-blue-500' : 'border-red-500'
                                } text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                placeholder="project_id.dataset"
                                value={form.datasetId}
                                onChange={handleInputChange('datasetId')}
                            />
                            {!isDatasetIdValid && datasetValidation.message && (
                                <p className="mt-2 text-xs text-red-400">{datasetValidation.message}</p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">
                                Provide the dataset ID alone or include the project as <code className="px-1 bg-gray-900 rounded">project.dataset</code>.
                                Missing datasets will be created automatically during export.
                            </p>
                            {datasetValidation.projectId && isDatasetIdValid && (
                                <p className="mt-1 text-[11px] text-gray-500">Target project detected: {datasetValidation.projectId}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Table prefix</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Optional prefix for every table"
                                    value={form.tablePrefix}
                                    onChange={handleInputChange('tablePrefix')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. EU or us-central1"
                                    value={form.location}
                                    onChange={handleInputChange('location')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Service account JSON key</label>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleKeyFileImportClick}
                                    className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isExporting}
                                >
                                    Import JSON key file
                                </button>
                                {importedKeyFileName && (
                                    <span className="text-sm text-gray-400">Loaded: {importedKeyFileName}</span>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/json,.json"
                                className="hidden"
                                onChange={handleKeyFileSelected}
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Import a service account JSON key file for authentication. Leave empty to use default credentials.
                                The JSON will be sent directly to Electron for authentication. It is kept on device only.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <label className="inline-flex items-center text-sm text-gray-300">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border border-gray-600 bg-gray-900 accent-blue-500 focus:ring-blue-500"
                                    checked={form.truncateBeforeInsert}
                                    onChange={handleInputChange('truncateBeforeInsert')}
                                />
                                <span className="ml-2">Truncate tables before inserting new data</span>
                            </label>

                            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 gap-3">
                                <label className="inline-flex items-center text-sm text-gray-300">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border border-gray-600 bg-gray-900 accent-blue-500 focus:ring-blue-500"
                                        checked={form.useCustomChunkSize}
                                        onChange={handleInputChange('useCustomChunkSize')}
                                    />
                                    <span className="ml-2">Use custom chunk size</span>
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    className="w-full md:w-32 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                    placeholder="500"
                                    value={form.chunkSize}
                                    onChange={handleInputChange('chunkSize')}
                                    disabled={!form.useCustomChunkSize}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-900 flex flex-col md:flex-row md:items-center md:justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-5 py-2.5 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-700 transition-colors"
                            disabled={isExporting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={isExporting || !isDatasetIdValid}
                        >
                            {isExporting ? 'Exporting…' : 'Export to BigQuery'}
                        </button>
                    </div>
                </form>

                {responseMeta && (
                    <div
                        className={`p-4 rounded-lg border ${
                            responseMeta.success
                                ? 'border-green-500/40 bg-green-500/10 text-green-200'
                                : 'border-red-500/40 bg-red-500/10 text-red-200'
                        }`}
                    >
                        {responseMeta.message}
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200">
                        {error}
                    </div>
                )}

                {result && (
                    <section className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
                        <header className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-semibold text-white">Export summary</h2>
                            <p className="text-sm text-gray-400 mt-1">Dataset: {result.datasetId}</p>
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-300">
                                <div className="bg-gray-900/60 rounded-lg p-3">
                                    <div className="text-xs uppercase text-gray-500">Tables</div>
                                    <div className="text-lg font-semibold text-white">{result.totals.tablesProcessed}</div>
                                </div>
                                <div className="bg-gray-900/60 rounded-lg p-3">
                                    <div className="text-xs uppercase text-gray-500">Rows exported</div>
                                    <div className="text-lg font-semibold text-white">{result.totals.rowsExported}</div>
                                </div>
                                <div className="bg-gray-900/60 rounded-lg p-3">
                                    <div className="text-xs uppercase text-gray-500">Errors</div>
                                    <div className="text-lg font-semibold text-white">{result.totals.errors}</div>
                                </div>
                                <div className="bg-gray-900/60 rounded-lg p-3">
                                    <div className="text-xs uppercase text-gray-500">Skipped</div>
                                    <div className="text-lg font-semibold text-white">{result.totals.skipped}</div>
                                </div>
                            </div>
                        </header>

                        <div className="p-6 space-y-3 max-h-[420px] overflow-y-auto">
                            {result.tableResults.map((table) => (
                                <div
                                    key={`${table.entity}-${table.tableId}`}
                                    className="p-4 rounded-lg border border-gray-700 bg-gray-900/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-white">{table.tableId}</p>
                                        <p className="text-xs text-gray-400">Entity: {table.entity}</p>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <span className="text-gray-300">Rows: {table.rowsExported}</span>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                table.status === 'success'
                                                    ? 'bg-green-500/10 text-green-300'
                                                    : table.status === 'skipped'
                                                        ? 'bg-yellow-500/10 text-yellow-300'
                                                        : 'bg-red-500/10 text-red-300'
                                            }`}
                                        >
                                            {table.status}
                                        </span>
                                    </div>
                                    {table.error && (
                                        <p className="text-xs text-red-300 md:text-right">{table.error}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}