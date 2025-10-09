import React, { useState } from 'react';

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

export function App() {
  const [fileContent, setFileContent] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

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
        alert('Ошибка: ' + result.error);
      }
    } catch (error) {
      alert('Ошибка при получении устройств: ' + (error as Error).message);
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
        alert('Устройство создано: ' + result.data.hostname);
        handleGetDevices(); // Обновляем список
      } else {
        alert('Ошибка: ' + result.error);
      }
    } catch (error) {
      alert('Ошибка при создании устройства: ' + (error as Error).message);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Electron + React + TypeORM + Inversify</h1>
      
      <div style={{ marginTop: 16 }}>
        <button onClick={handleReadFile} style={{ marginRight: 8 }}>
          Прочитать файл
        </button>
        <button 
          onClick={handleGetDevices} 
          disabled={loading}
          style={{ marginRight: 8 }}
        >
          {loading ? 'Загрузка...' : 'Показать устройства'}
        </button>
        <button onClick={handleCreateTestDevice}>
          Создать тестовое устройство
        </button>
      </div>

      {devices.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>Найдено устройств: {devices.length}</h3>
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
                  <p>Создано: {new Date(device.firstSeenSnapshot.created_at).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>Содержимое файла:</h3>
      <pre style={{ 
        backgroundColor: '#f4f4f4', 
        padding: 16, 
        borderRadius: 4, 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-all'
      }}>
        {fileContent || 'Нажмите на кнопку, чтобы выбрать и прочитать файл...'}
      </pre>
    </div>
  );
}