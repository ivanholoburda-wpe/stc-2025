import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Device, Interface, getDevices } from '../../api/devices';
import { getAvailableMetrics, getTimeSeries, Metric } from '../../api/analytics';

export function AnalyticsView() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [deviceSearch, setDeviceSearch] = useState('');
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [selectedInterfaceName, setSelectedInterfaceName] = useState('');
    const [availableMetrics, setAvailableMetrics] = useState<Metric[]>([]);
    const [selectedMetricId, setSelectedMetricId] = useState('');
    const [chartData, setChartData] = useState<{ time: string; value: number; }[]>([]);
    const [loading, setLoading] = useState({
        initial: true,
        chart: false,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(prev => ({ ...prev, initial: true }));
            setError('');
            try {
                const [devicesResult, metricsResult] = await Promise.all([
                    getDevices(),
                    getAvailableMetrics()
                ]);

                if (devicesResult.success && devicesResult.data) {
                    setDevices(devicesResult.data);
                    if (devicesResult.data.length > 0) {
                        setSelectedDeviceId(devicesResult.data[0].id.toString());
                    }
                } else {
                    setError(devicesResult.error || 'Failed to load devices.');
                }

                if (metricsResult.success && metricsResult.data) {
                    setAvailableMetrics(metricsResult.data);
                    if (metricsResult.data.length > 0) {
                        setSelectedMetricId(metricsResult.data[0].id);
                    }
                } else {
                    setError(metricsResult.error || 'Failed to load metrics.');
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
            } finally {
                setLoading(prev => ({ ...prev, initial: false }));
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedDeviceId || !selectedMetricId) return;

        const selectedMetric = availableMetrics.find(m => m.id === selectedMetricId);
        const options: { interfaceName?: string } = {};

        if (selectedMetric?.category === 'Interfaces') {
            if (!selectedInterfaceName) {
                setChartData([]);
                return;
            }
            options.interfaceName = selectedInterfaceName;
        }

        const fetchChartData = async () => {
            setLoading(prev => ({ ...prev, chart: true }));
            setError('');
            const result = await getTimeSeries(selectedMetricId, parseInt(selectedDeviceId), options);
            if (result.success && result.data) {
                const formattedData = result.data.map(d => ({
                    ...d,
                    time: new Date(d.time).toLocaleString(),
                }));
                setChartData(formattedData);
            } else {
                setError(result.error || 'Failed to load chart data.');
                setChartData([]);
            }
            setLoading(prev => ({ ...prev, chart: false }));
        };
        fetchChartData();
    }, [selectedDeviceId, selectedInterfaceName, selectedMetricId, availableMetrics]);

    useEffect(() => {
        setSelectedInterfaceName('');
    }, [selectedDeviceId]);

    const filteredDevices = useMemo(() => {
        const term = deviceSearch.trim().toLowerCase();
        if (!term) return devices;
        return devices.filter(device => {
            const hostnameMatch = device.hostname.toLowerCase().includes(term);
            const modelMatch = device.model?.toLowerCase().includes(term);
            const folderMatch = device.folder_name?.toLowerCase().includes(term);
            return hostnameMatch || modelMatch || folderMatch;
        });
    }, [deviceSearch, devices]);

    useEffect(() => {
        if (loading.initial) return;

        if (filteredDevices.length === 0) {
            setSelectedDeviceId('');
            return;
        }

        if (!filteredDevices.some(device => device.id.toString() === selectedDeviceId)) {
            setSelectedDeviceId(filteredDevices[0].id.toString());
        }
    }, [filteredDevices, loading.initial, selectedDeviceId]);

    const selectedDevice = useMemo(() => devices.find(d => d.id.toString() === selectedDeviceId), [selectedDeviceId, devices]);
    const interfacesForSelectedDevice = useMemo(() => selectedDevice?.interfaces || [], [selectedDevice]);
    const selectedMetric = useMemo(() => availableMetrics.find(m => m.id === selectedMetricId), [selectedMetricId, availableMetrics]);
    const metricRequiresInterface = useMemo(() => selectedMetric?.category === 'Interfaces', [selectedMetric]);
    const groupedMetrics = useMemo(() => {
        return availableMetrics.reduce((acc, metric) => {
            (acc[metric.category] = acc[metric.category] || []).push(metric);
            return acc;
        }, {} as Record<string, Metric[]>);
    }, [availableMetrics]);

    return (
        <div className="flex flex-col h-full p-6 text-white bg-gray-900">
            <div className="flex-shrink-0 mb-6 flex items-center gap-6">
                <div className="flex flex-col gap-2">
                    <label htmlFor="device-search" className="block text-sm font-medium text-gray-300">Devices search:</label>
                    <input
                        id="device-search"
                        type="text"
                        value={deviceSearch}
                        onChange={(e) => setDeviceSearch(e.target.value)}
                        placeholder="Enter a name, model, or folder"
                        className="w-64 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading.initial}
                    />
                </div>

                <div>
                    <label htmlFor="device-select" className="block text-sm font-medium text-gray-300 mb-2">Device:</label>
                    <select
                        id="device-select"
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        className="w-64 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading.initial}
                    >
                        {loading.initial ? (
                            <option>Loading...</option>
                        ) : filteredDevices.length === 0 ? (
                            <option value="">Devices not found.</option>
                        ) : (
                            filteredDevices.map(device => (
                                <option key={device.id} value={device.id}>{device.hostname}</option>
                            ))
                        )}
                    </select>
                </div>

                <div>
                    <label htmlFor="metric-select" className="block text-sm font-medium text-gray-300 mb-2">Metric:</label>
                    <select
                        id="metric-select"
                        value={selectedMetricId}
                        onChange={(e) => setSelectedMetricId(e.target.value)}
                        className="w-64 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading.initial}
                    >
                        {Object.entries(groupedMetrics).map(([category, metrics]) => (
                            <optgroup label={category} key={category}>
                                {metrics.map(metric => (
                                    <option key={metric.id} value={metric.id}>{metric.label}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {metricRequiresInterface && (
                    <div>
                        <label htmlFor="interface-select" className="block text-sm font-medium text-gray-300 mb-2">Interface:</label>
                        <select
                            id="interface-select"
                            value={selectedInterfaceName}
                            onChange={(e) => setSelectedInterfaceName(e.target.value)}
                            className="w-64 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={interfacesForSelectedDevice.length === 0}
                        >
                            <option value="">-- Choose interface --</option>
                            {interfacesForSelectedDevice.map(iface => (
                                <option key={iface.id} value={iface.name}>{iface.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex-grow bg-gray-800 rounded-xl shadow-2xl p-4">
                {(loading.initial || loading.chart) && (
                    <div className="flex items-center justify-center h-full text-gray-500">Loading graph data...</div>
                )}
                {error && <div className="flex items-center justify-center h-full text-red-400">{error}</div>}
                {!loading.initial && !loading.chart && !error && chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                            <XAxis dataKey="time" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                            <YAxis unit={selectedMetric?.unit} stroke="#A0AEC0" tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }}
                                labelStyle={{ color: '#E2E8F0' }}
                            />
                            <Legend />
                            <Line type="stepAfter" dataKey="value" name={selectedMetric?.label || 'Value'} stroke="#38B2AC" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
                {!loading.initial && !loading.chart && !error && chartData.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No data to display.
                    </div>
                )}
            </div>
        </div>
    );
}


