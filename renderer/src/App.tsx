import React, { useState, useEffect } from 'react';

interface Device {
  id: number;
  hostname: string;
  model?: string;
  firstSeenSnapshot?: {
    id: number;
    created_at: string;
    root_folder_path: string;
  };
}

declare global {
  interface Window {
    configAPI: {
      isOfflineMode: () => Promise<boolean>;
      getAiModelKey: () => Promise<string | null>;
    };
  }
}

export function App() {
  const [fileContent, setFileContent] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(true);

  const handleReadFile = async () => {
    const content = await window.electronAPI.readFile();
    setFileContent(content);
  };

  const handleGetDevices = async () => {
    setLoading(true);
    try {
      console.log(window.electronAPI);
      const result = await window.electronAPI.getDevices();
      if (result.success) {
        setDevices(result.data);
      } else {
        console.log(result.error);
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error fetching devices: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestDevice = async () => {
    try {
      const result = await window.electronAPI.createDevice({
        hostname: `test-device-${Date.now()}`,
        model: 'Test Model'
      });
      if (result.success) {
        alert('Device created: ' + result.data.hostname);
        handleGetDevices();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error while creating device: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    async function fetchConfig() {
      try {
        const offlineStatus = await window.configAPI.isOfflineMode();
        setIsOffline(offlineStatus);
      } catch (error) {
        console.error("Failed to fetch configuration:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Electron + React + TypeORM + Inversify</h1>
      <p>
        Application status: 
        {loading 
          ? 'Loading...' 
          : <b>{isOffline ? 'Offline mode' : 'Online mode'}</b>
        }
      </p>
      
      <div style={{ marginTop: 16 }}>
        <button onClick={handleReadFile} style={{ marginRight: 8 }}>
          Read file
        </button>
        <button 
          onClick={handleGetDevices} 
          disabled={loading}
          style={{ marginRight: 8 }}
        >
          {loading ? 'Loading...' : 'Show devices'}
        </button>
        <button onClick={handleCreateTestDevice}>
          Create test device
        </button>
      </div>

      {devices.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>Devices: {devices.length}</h3>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            {devices.map(device => (
              <div 
                key={device.id} 
                style={{ 
                  border: '1px solid #ddd', 
                  padding: 16, 
                  borderRadius: 8,
                  backgroundColor: '#f9f9f9'
                }}
              >
                <h4>{device.hostname}</h4>
                <p>ID: {device.id}</p>
                {device.model && <p>Модель: {device.model}</p>}
                {device.firstSeenSnapshot && (
                  <p>Created at: {new Date(device.firstSeenSnapshot.created_at).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>File content:</h3>
      <pre style={{ 
        backgroundColor: '#f4f4f4', 
        padding: 16, 
        borderRadius: 4, 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-all'
      }}>
        {fileContent || 'Choose the file...'}
      </pre>
    </div>
  );
}