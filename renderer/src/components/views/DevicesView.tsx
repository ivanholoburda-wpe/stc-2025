import React from 'react';
import { Device } from '../../api/types';

interface DevicesViewProps {
  devices: Device[];
  loading: boolean;
  onGetDevices: () => Promise<void>;
  onCreateDevice: () => Promise<void>;
}

export const DevicesView: React.FC<DevicesViewProps> = ({ devices, loading, onGetDevices, onCreateDevice }) => (
  <div className="p-8">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-semibold text-white">Devices ({devices.length})</h2>
      <div className="flex gap-4">
        <button
          onClick={onCreateDevice}
          className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          Create Test Device
        </button>
        <button
          onClick={onGetDevices}
          className="bg-gray-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Devices'}
        </button>
      </div>
    </div>

    {loading && !devices.length ? (
      <p className="text-gray-400">Loading devices...</p>
    ) : !devices.length ? (
      <p className="text-gray-400">No devices found. Click "Refresh Devices" to fetch.</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {devices.map((device) => (
          <div key={device.id} className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-white">
            <h4 className="text-lg font-bold truncate">{device.hostname}</h4>
            <p className="text-sm text-gray-400">ID: {device.id}</p>
            {device.model && <p className="text-sm text-gray-300 mt-2">Model: {device.model}</p>}
            {device.firstSeenSnapshot && (
              <p className="text-xs text-gray-500 mt-3">
                Created: {new Date(device.firstSeenSnapshot.created_at).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);