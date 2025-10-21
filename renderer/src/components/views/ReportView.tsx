import React, { useState, useEffect } from 'react';
import { getSnapshots } from '../../api/snapshot';
import type { Snapshot } from '../../api/snapshot';
import { exportApi } from '../../api/export';
import { DownloadIcon } from '../../icons';

// Стейт для отслеживания статуса загрузки для каждой кнопки
type ExportStatus = {
    [snapshotId: number]: {
        loading: boolean;
        message: string;
        isError: boolean;
    }
};

export const ReportsView: React.FC = () => {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [viewError, setViewError] = useState<string | null>(null);
    const [status, setStatus] = useState<ExportStatus>({});

    // 1. Загружаем снэпшоты при старте, обрабатывая APIResult
    useEffect(() => {
        getSnapshots()
            .then(result => {
                if (result.success) {
                    setSnapshots(result.data || []);
                } else {
                    console.error("Ошибка загрузки снэпшотов:", result.error);
                    setViewError(result.error || 'Не удалось загрузить список снэпшотов.');
                }
            })
            .catch(err => {
                console.error("Критическая ошибка загрузки снэпшотов:", err);
                setViewError('Не удалось загрузить список снэпшотов.');
            });
    }, []);

    // 2. Обработчик нажатия кнопки "Скачать"
    const handleExport = async (snapshotId: number) => {
        // Устанавливаем статус "загрузка"
        setStatus(prev => ({
            ...prev,
            [snapshotId]: { loading: true, message: 'Создание отчета...', isError: false }
        }));

        try {
            // Вызываем "плоский" экспорт
            const result = await exportApi.flatReport(snapshotId);

            if (result.success) {
                // Успех
                setStatus(prev => ({
                    ...prev,
                    [snapshotId]: { loading: false, message: `✅ Готово: ${result.path}`, isError: false }
                }));
            } else {
                // Ошибка или отмена
                const errorMsg = result.message === 'Export cancelled.'
                    ? 'Отменено пользователем.'
                    : `🚫 Ошибка: ${result.message}`;
                setStatus(prev => ({
                    ...prev,
                    [snapshotId]: { loading: false, message: errorMsg, isError: true }
                }));
            }
        } catch (err) {
            // Критическая ошибка
            setStatus(prev => ({
                ...prev,
                [snapshotId]: { loading: false, message: `🚫 Критическая ошибка: ${(err as Error).message}`, isError: true }
            }));
        }
    };

    // 3. Рендер в стиле Tailwind
    return (
        <div className="p-4 bg-gray-800 text-white flex-1 overflow-auto">
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Генерация Отчетов</h2>

            {viewError && (
                <div className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-lg mb-4">
                    {viewError}
                </div>
            )}

            {snapshots.length === 0 && !viewError && (
                <p className="text-gray-400">Снэпшоты не найдены. Загрузите логи для начала работы.</p>
            )}

            <ul className="space-y-4">
                {snapshots.map(snap => {
                    const currentStatus = status[snap.id];

                    return (
                        <li key={snap.id} className="bg-gray-900 p-4 rounded-lg shadow-md border border-gray-700">
                            <div className="flex justify-between items-center">
                                {/* Инфо о снэпшоте */}
                                <div>
                                    <div className="font-bold text-lg text-white">Снэпшот ID: {snap.id}</div>
                                    <div className="text-sm text-gray-400">
                                        {new Date(snap.created_at).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-300 mt-1">
                                        {snap.description || 'Нет описания'}
                                    </div>
                                </div>

                                {/* Кнопка экспорта */}
                                <button
                                    onClick={() => handleExport(snap.id)}
                                    disabled={currentStatus?.loading}
                                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {currentStatus?.loading ? (
                                        <div className="w-5 h-5 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                                    ) : (
                                        <DownloadIcon className="w-5 h-5 mr-2" />
                                    )}
                                    {currentStatus?.loading ? 'В процессе...' : 'Скачать отчет'}
                                </button>
                            </div>

                            {/* Сообщение о статусе (под кнопкой) */}
                            {currentStatus?.message && (
                                <p className={`mt-3 text-sm ${currentStatus.isError ? 'text-red-400' : 'text-green-400'}`}>
                                    {currentStatus.message}
                                </p>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};