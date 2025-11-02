import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ViewId } from './components/ui/Sidebar';
import { Header } from './components/ui/Header';
import { Modal } from './components/ui/Modal';
import { DashboardView } from './components/views/DashboardView';
import { DevicesView } from './components/views/DevicesView';
import { PlaceholderView } from './components/views/PlaceholderView';
import { AiView } from './components/views/AiView';
import { TopologyView } from './components/views/TopologyView';
import { APIResult, ParsingResult } from './api/types';
import {AnalyticsView} from "./components/views/AnalyticsView";
import {AlertsView} from "./components/views/AlertsView";
import { ReportsView } from './components/views/ReportView';
import {SettingsView} from "./components/views/SettingsView";
import {BigQueryView} from "./components/views/BigQueryView";

const extendedViewIds = ['dashboard', 'devices', 'ai', 'topology', 'analytics', 'alerts', 'reports', 'bigquery', 'settings'] as const;
export type ExtendedViewId = typeof extendedViewIds[number];


const viewTitles: Record<ExtendedViewId, string> = {
    dashboard: 'Home',
    devices: 'Devices',
    topology: 'Network Map',
    ai: 'AI Agent: Ruslan4ick 1.0',
    analytics: 'Analytics',
    alerts: 'Alerts',
    reports: 'Reports',
    bigquery: 'BigQuery Export',
    settings: 'Settings',
};

export function App() {
    const [activeView, setActiveView] = useState<ExtendedViewId>('dashboard');
    const [parsingResult, setParsingResult] = useState<ParsingResult>();
    const [modalMessage, setModalMessage] = useState('');

    const handleShowMessage = (message: string) => {
        setModalMessage(message);
    };

    const handleReadFile = useCallback(async () => {
        try {
            if (window.electronAPI) {
                const content = await window.electronAPI.runParsing();
                if (content && content.success) {
                    setParsingResult(content);
                } else {
                    setParsingResult(undefined);
                    const msg = content && content.message ? content.message : 'Folder selection was cancelled or failed';
                    handleShowMessage(msg);
                }
            } else {
                console.warn('electronAPI not found. Running in browser mode.');
            }
        } catch (error) {
            handleShowMessage('Error reading file: ' + (error as Error).message);
        }
    }, []);


    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardView onReadFile={handleReadFile} parsingResult={parsingResult} />;
            case 'devices':
                return (
                    <DevicesView/>
                );
            case 'topology':
                return <TopologyView />;
            case 'ai': return <AiView />;
            case 'analytics':
                return <AnalyticsView />;
            case 'alerts':
                return <AlertsView />;
            case 'reports':
                return <ReportsView />;
            case 'bigquery':
                return <BigQueryView />;
            case 'settings':
                return <SettingsView />;
            default:
                return <DashboardView onReadFile={handleReadFile} parsingResult={parsingResult} />;
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
