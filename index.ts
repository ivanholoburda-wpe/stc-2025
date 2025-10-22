import {app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import {AppDataSource} from './backend/src/database/data-source';
import {container} from './backend/src/container';
import {ParsingHandler} from './backend/src/handlers/ParsingHandler';
import {DeviceHandler} from './backend/src/handlers/DeviceHandler';
import {SnapshotHandler} from "./backend/src/handlers/SnapshotHandler";
import { TYPES } from './backend/src/types';
import { DefaultOptionsSeeder } from './backend/src/services/seeders/OptionsSeeder';
import {TopologyHandler} from "./backend/src/handlers/TopologyHandler";
import {AnalyticsHandler} from "./backend/src/handlers/AnalyticsHandler";
import {AlarmsHandler} from "./backend/src/handlers/AlarmsHandler";
import {SettingHandler} from "./backend/src/handlers/SettingHandler";
import {IConfigurationService} from "./backend/src/services/config/ConfigurationService";

function createWindow(): void {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    console.log(process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
    }
}

app.whenReady().then(async () => {
    try {
        await AppDataSource.initialize();
        await AppDataSource.runMigrations();

        console.log('Database initialized and migrations completed');
        const optionsSeeder = container.get<DefaultOptionsSeeder>(TYPES.DefaultOptionsSeeder);
        await optionsSeeder.run();

        const parsingHandler = container.get(ParsingHandler);
        const deviceHandler = container.get(DeviceHandler);
        const snapshotHandler = container.get(SnapshotHandler);
        const topologyHandler = container.get(TopologyHandler);
        const analyticsHandler = container.get(AnalyticsHandler);
        const alaramsHandler = container.get(AlarmsHandler);
        const settingHandler = container.get(SettingHandler);
        const configService = container.get<IConfigurationService>(TYPES.ConfigurationService);

        // Settings handlers
        ipcMain.handle('config:get-settings', async () => {
            return await settingHandler.getSettings();
        });

        ipcMain.handle('config:set-network-mode', async (event, isOffline: boolean) => {
            return await settingHandler.setNetworkMode(isOffline);
        });

        ipcMain.handle('config:set-ai-model-key', async (event, key: string) => {
            return await configService.setAiModelKey(key);
        });

        ipcMain.handle('config:set-ai-prompt-start', async (event, prompt: string) => {
            return await configService.setAiPromptStart(prompt);
        });

        ipcMain.handle('run-parsing', async () => {
            return await parsingHandler.startParsing();
        })

        ipcMain.handle('get-devices', async () => {
            return await deviceHandler.getAllDevices();
        });

        ipcMain.handle('get-details-for-summary', (event, deviceId, snapshotId) => {
            return deviceHandler.getDetailsForSummary(deviceId, snapshotId);
        });
        ipcMain.handle('get-interfaces-for-device', (event, deviceId, snapshotId) => {
            return deviceHandler.getInterfacesForDevice(deviceId, snapshotId);
        });
        ipcMain.handle('get-routing-for-device', (event, deviceId, snapshotId) => {
            return deviceHandler.getRoutingForDevice(deviceId, snapshotId);
        });
        ipcMain.handle('get-protocols-for-device', (event, deviceId, snapshotId) => {
            return deviceHandler.getProtocolsForDevice(deviceId, snapshotId);
        });
        ipcMain.handle('get-hardware-for-device', (event, deviceId, snapshotId) => {
            return deviceHandler.getHardwareForDevice(deviceId, snapshotId);
        });
        ipcMain.handle('get-vpn-for-device', (event, deviceId, snapshotId) => {
            return deviceHandler.getVpnForDevice(deviceId, snapshotId);
        });

        ipcMain.handle('get-snapshots', async () => {
            return await snapshotHandler.getAllSnapshots();
        })

        ipcMain.handle('analyze-snapshot', async (event, snapshotId, prompt) => {
            return await snapshotHandler.analyzeSnapshot(snapshotId, prompt);
        })

        ipcMain.handle('get-topology', async () => {
            return await topologyHandler.getTopology();
        })

        ipcMain.handle('get-available-metrics', async () => {
            return await analyticsHandler.getAvailableMetrics();
        });

        ipcMain.handle('get-time-series', async (event, metricId, deviceId, options) => {
            return await analyticsHandler.getAnalytics(metricId, deviceId, options);
        });

        ipcMain.handle('get-alarms', async (event, snapshotId) => {
            return await alaramsHandler.getAllBySnapshot(snapshotId);
        })
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
