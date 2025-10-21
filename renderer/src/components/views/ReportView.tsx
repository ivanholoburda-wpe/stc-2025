import React, { useState, useEffect } from 'react';
import { getSnapshots, Snapshot } from '../../api/snapshot';
import { getAvailableReports, exportReport, ReportDefinition } from '../../api/export';
import { DownloadIcon } from '../../icons';

export const ReportsView: React.FC = () => {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [availableReports, setAvailableReports] = useState<ReportDefinition[]>([]);

    const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
    const [selectedReportId, setSelectedReportId] = useState<string>('');

    const [loading, setLoading] = useState({ initial: true, export: false });
    const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(prev => ({ ...prev, initial: true }));
            try {
                const [snapshotsResult, reportsResult] = await Promise.all([
                    getSnapshots(),
                    getAvailableReports()
                ]);

                if (snapshotsResult.success && snapshotsResult.data) {
                    setSnapshots(snapshotsResult.data);
                    if (snapshotsResult.data.length > 0) {
                        setSelectedSnapshotId(snapshotsResult.data[0].id.toString());
                    }
                } else {
                    setStatus({ message: snapshotsResult.error || 'Не вдалося завантажити знімки.', isError: true });
                }

                if (reportsResult.success && reportsResult.data) {
                    setAvailableReports(reportsResult.data);
                    if (reportsResult.data.length > 0) {
                        setSelectedReportId(reportsResult.data[0].id);
                    }
                } else {
                    setStatus({ message: reportsResult.error || 'Не вдалося завантажити список звітів.', isError: true });
                }
            } catch (err) {
                setStatus({ message: `Критична помилка: ${(err as Error).message}`, isError: true });
            } finally {
                setLoading(prev => ({ ...prev, initial: false }));
            }
        };
        fetchInitialData();
    }, []);

    // 2. Обробник натискання кнопки "Сгенерувати"
    const handleExport = async () => {
        if (!selectedSnapshotId || !selectedReportId) {
            setStatus({ message: 'Будь ласка, оберіть знімок та тип звіту.', isError: true });
            return;
        }

        setLoading(prev => ({ ...prev, export: true }));
        setStatus({ message: 'Генерація звіту...', isError: false });

        try {
            const result = await exportReport(selectedReportId, parseInt(selectedSnapshotId));

            if (result.success) {
                setStatus({ message: `✅ Звіт успішно збережено: ${result.path}`, isError: false });
            } else {
                const errorMsg = result.message === 'Export cancelled.'
                    ? 'Скасовано користувачем.'
                    : `🚫 Помилка: ${result.message}`;
                setStatus({ message: errorMsg, isError: true });
            }
        } catch (err) {
            setStatus({ message: `🚫 Критична помилка: ${(err as Error).message}`, isError: true });
        } finally {
            setLoading(prev => ({ ...prev, export: false }));
        }
    };

    const selectedReport = availableReports.find(r => r.id === selectedReportId);

    return (
        <div className="p-6 bg-gray-900 text-white flex-1 overflow-auto">
            <h2 className="text-2xl font-semibold mb-6 text-gray-100">Генерація звітів</h2>

            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                {loading.initial ? (
                    <p className="text-gray-400">Завантаження доступних опцій...</p>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div>
                                <label htmlFor="snapshot-select" className="block text-sm font-medium text-gray-300 mb-2">Оберіть знімок:</label>
                                <select
                                    id="snapshot-select"
                                    value={selectedSnapshotId}
                                    onChange={(e) => setSelectedSnapshotId(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {snapshots.map(snap => (
                                        <option key={snap.id} value={snap.id}>
                                            Snapshot #{snap.id} - {new Date(snap.created_at).toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="report-select" className="block text-sm font-medium text-gray-300 mb-2">Оберіть тип звіту:</label>
                                <select
                                    id="report-select"
                                    value={selectedReportId}
                                    onChange={(e) => setSelectedReportId(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {availableReports.map(report => (
                                        <option key={report.id} value={report.id}>{report.label}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleExport}
                                disabled={loading.export}
                                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {loading.export ? (
                                    <div className="w-5 h-5 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                                ) : (
                                    <DownloadIcon className="w-5 h-5 mr-2" />
                                )}
                                {loading.export ? 'В процесі...' : 'Сгенерувати звіт'}
                            </button>
                        </div>

                        {selectedReport && (
                            <div className="pt-4 border-t border-gray-700">
                                <p className="text-sm text-gray-400">{selectedReport.description}</p>
                            </div>
                        )}

                        {status && (
                            <div className="pt-4">
                                <p className={`text-sm ${status.isError ? 'text-red-400' : 'text-green-400'}`}>
                                    {status.message}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
