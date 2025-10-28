import React, { useState } from 'react';
import { UploadCloudIcon } from '../../icons';

declare global {
    interface Window {
        gcloud: {
            selectKey: () => Promise<{ ok: boolean; keyPath?: string } | undefined>;
            exportToBigQuery: () => Promise<{ ok: boolean; error?: string } | undefined>;
        };
    }
}

const CARD =
    'w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-xl flex flex-col items-center justify-center p-16 text-center';

export default function BigQueryView() {
    const [msg, setMsg] = useState<string>('');

    const pickKey = async () => {
        const res = await window.gcloud?.selectKey();
        setMsg(res?.ok ? `Key selected: ${res.keyPath}` : 'Canceled / no file');
    };

    const exportBQ = async () => {
        setMsg('Exporting...');
        const res = await window.gcloud?.exportToBigQuery();
        setMsg(res?.ok ? 'Done!' : `Error: ${res?.error}`);
    };

    const statusClass =
        msg.startsWith('Error:')
            ? 'text-red-400'
            : msg === 'Done!'
                ? 'text-green-400'
                : 'text-gray-300';

    return (
        <div className="flex-grow flex items-center justify-center p-8">
            <div className={CARD}>
                <UploadCloudIcon className="w-16 h-16 text-gray-500 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">BigQuery Export</h2>
                <p className="text-gray-400 mb-6">
                    Виберіть ключ сервіс-аккаунта для відправки до бази в BigQuery.
                </p>

                <div className="w-full grid gap-3">
                    <h3 className="text-white">Google Cloud → BigQuery</h3>

                    <button
                        onClick={pickKey}
                        className="bg-gray-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-500 transition-colors"
                    >
                        Select Service Account JSON
                    </button>

                    <button
                        onClick={exportBQ}
                        className="bg-gray-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-500 transition-colors"
                    >
                        Export to BigQuery
                    </button>

                    <div className={`whitespace-pre-wrap font-mono ${statusClass}`}>{msg}</div>
                </div>
            </div>
        </div>
    );
}
