import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ViewId } from './components/ui/Sidebar';
import { Header } from './components/ui/Header';
import { Modal } from './components/ui/Modal';
import { DashboardView } from './components/views/DashboardView';
import { DevicesView } from './components/views/DevicesView';
import { PlaceholderView } from './components/views/PlaceholderView';
import { Device, APIResult } from './api/types';
import { useConfig } from './hooks/useConfig';

// Мапа для відображення заголовків сторінок
const viewTitles: Record<ViewId, string> = {
  dashboard: 'Home',
  devices: 'Devices',
  analytics: 'Analytics',
  alerts: 'Alerts',
  reports: 'Reports',
};

export function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [fileContent, setFileContent] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const { isOffline, loading: configLoading } = useConfig();

  const handleShowMessage = (message: string) => {
    setModalMessage(message);
  };

  /**
   * Логіка читання файлу.
   */
  const handleReadFile = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const content = await window.electronAPI.readFile();
        setFileContent(content);
      } else {
        console.warn('electronAPI not found. Running in browser mode.');
        setFileContent('This is mock file content because electronAPI is not available.');
      }
    } catch (error) {
      handleShowMessage('Error reading file: ' + (error as Error).message);
    }
  }, []);

  /**
   * Логіка отримання списку пристроїв.
   */
  const handleGetDevices = useCallback(async () => {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const result: APIResult<Device[]> = await window.electronAPI.getDevices();
        if (result.success) {
          setDevices(result.data || []);
        } else {
          handleShowMessage('Error: ' + result.error);
        }
      } else {
        console.warn('electronAPI not found. Using mock data.');
        setDevices([
          { id: 1, hostname: 'mock-device-1', model: 'Mock Model X' },
          { id: 2, hostname: 'mock-device-2', model: 'Mock Model Y', firstSeenSnapshot: { id: 100, created_at: new Date().toISOString(), root_folder_path: '/mock' } },
        ]);
      }
    } catch (error) {
      handleShowMessage('Error fetching devices: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Логіка створення тестового пристрою.
   */
  const handleCreateTestDevice = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const result: APIResult<Device> = await window.electronAPI.createDevice({
          hostname: `test-device-${Date.now()}`,
          model: 'Test Model',
        });
        if (result.success && result.data) {
          handleShowMessage('Device created: ' + result.data.hostname);
          handleGetDevices(); // Оновити список
        } else if (result.error) {
          handleShowMessage('Error: ' + result.error);
        }
      } else {
        console.warn('electronAPI not found. Cannot create device.');
        handleShowMessage('Cannot create device in browser mode.');
      }
    } catch (error) {
      handleShowMessage('Error while creating device: ' + (error as Error).message);
    }
  }, [handleGetDevices]);

  // Завантажити пристрої при першому відкритті сторінки "Devices"
  useEffect(() => {
    if (activeView === 'devices') {
      handleGetDevices();
    }
  }, [activeView, handleGetDevices]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onReadFile={handleReadFile} fileContent={fileContent} />;
      case 'devices':
        return (
          <DevicesView
            devices={devices}
            loading={loading}
            onGetDevices={handleGetDevices}
            onCreateDevice={handleCreateTestDevice}
          />
        );
      case 'analytics':
      case 'alerts':
      case 'reports':
        return <PlaceholderView title={viewTitles[activeView]} />;
      default:
        return <DashboardView onReadFile={handleReadFile} fileContent={fileContent} />;
    }
  };

  return (
    <>
      <Modal message={modalMessage} onClose={() => setModalMessage('')} />
      <div className="flex h-screen bg-gray-900 font-sans">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header viewTitle={viewTitles[activeView] || 'Home'} />
          <div className="flex-1 overflow-y-auto">{renderActiveView()}</div>
        </main>
      </div>
    </>
  );
}