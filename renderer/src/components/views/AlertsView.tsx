import React, { useState, useEffect } from 'react';
import { getSnapshots, Snapshot } from '../../api/snapshot';
import { getAlarmsForSnapshot, Alarm } from '../../api/alarms';

const LevelBadge = ({ level }: { level: string }) => {
    const levelStyles: Record<string, string> = {
        'Critical': 'bg-red-500 text-white',
        'Major': 'bg-orange-500 text-white',
        'Warning': 'bg-yellow-500 text-black',
        'Info': 'bg-blue-500 text-white',
    };
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${levelStyles[level] || 'bg-gray-500 text-white'}`}>
            {level}
        </span>
    );
};

export function AlertsView() {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [selectedSnapshotId, setSelectedSnapshotId] = useState('');
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [loading, setLoading] = useState({ snapshots: true, alarms: false });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSnapshots = async () => {
            setLoading(prev => ({ ...prev, snapshots: true }));
            try {
                const result = await getSnapshots();
                if (result.success && result.data) {
                    setSnapshots(result.data);
                    if (result.data.length > 0) {
                        setSelectedSnapshotId(result.data[0].id.toString());
                    }
                } else {
                    setError(result.error || 'Failed to load snapshots.');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred.');
            } finally {
                setLoading(prev => ({ ...prev, snapshots: false }));
            }
        };
        fetchSnapshots();
    }, []);

    useEffect(() => {
        if (!selectedSnapshotId) return;

        const fetchAlarms = async () => {
            setLoading(prev => ({ ...prev, alarms: true }));
            setError('');
            try {
                const result = await getAlarmsForSnapshot(parseInt(selectedSnapshotId));

                if (result.success && result.data) {
                    setAlarms(result.data);
                } else {
                    setError(result.error || 'Failed to load alarms.');
                    setAlarms([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred.');
            } finally {
                setLoading(prev => ({ ...prev, alarms: false }));
            }
        };
        fetchAlarms();
    }, [selectedSnapshotId]);

    return (
        <div className="flex flex-col h-full p-6 text-white bg-gray-900">
            <div className="flex-shrink-0 mb-6">
                <label htmlFor="snapshot-select" className="block text-sm font-medium text-gray-300 mb-2">Select snapshot:</label>
                <select
                    id="snapshot-select"
                    value={selectedSnapshotId}
                    onChange={(e) => setSelectedSnapshotId(e.target.value)}
                    disabled={loading.snapshots}
                    className="w-full max-w-md bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {loading.snapshots ? <option>Loading...</option> : snapshots.map(snap => (
                        <option key={snap.id} value={snap.id}>
                            Snapshot #{snap.id} - {new Date(snap.created_at).toLocaleString()}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex-grow bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                {loading.alarms && <div className="flex items-center justify-center h-full text-gray-500">Loading alerts...</div>}
                {error && <div className="flex items-center justify-center h-full text-red-400">{error}</div>}
                {!loading.alarms && !error && (
                    <div className="overflow-y-auto h-full">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Index</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Level</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Information</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">OID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ENT Code</th>
                            </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {alarms.length > 0 ? alarms.map((alarm) => (
                                <tr key={alarm.id} className="hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{alarm.index}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><LevelBadge level={alarm.level} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{alarm.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{alarm.time}</td>
                                    <td className="px-6 py-4 text-sm text-gray-300">{alarm.info}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{alarm.oid}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{alarm.ent_code}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-500">No alerts for this snapshot.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

