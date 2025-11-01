import {app, BrowserWindow, ipcMain, dialog} from 'electron';
import path from 'path';
import {AppDataSource} from './backend/src/database/data-source';
import {container} from './backend/src/container';
import {ParsingHandler} from './backend/src/handlers/ParsingHandler';
import {DeviceHandler} from './backend/src/handlers/DeviceHandler';
import {SnapshotHandler} from "./backend/src/handlers/SnapshotHandler";
import {TYPES} from './backend/src/types';
import {DefaultOptionsSeeder} from './backend/src/services/seeders/OptionsSeeder';
import {TopologyHandler} from "./backend/src/handlers/TopologyHandler";
import {ExportHandler} from "./backend/src/handlers/ExportHandler";
import {AnalyticsHandler} from "./backend/src/handlers/AnalyticsHandler";
import {AlarmsHandler} from "./backend/src/handlers/AlarmsHandler";
import {ConfigurationHandler} from "./backend/src/handlers/ConfigurationHandler";
import {MaintenanceHandler} from "./backend/src/handlers/MaintenanceHandler";

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
        const exportHandler = container.get(ExportHandler);
        const analyticsHandler = container.get(AnalyticsHandler);
        const alaramsHandler = container.get(AlarmsHandler);
        const configurationHandler = container.get(ConfigurationHandler);
        const maintenanceHandler = container.get(MaintenanceHandler);

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
        ipcMain.handle('get-vlans-for-device', (event, deviceId, snapshotId) => {
            return deviceHandler.getVlansForDevice(deviceId, snapshotId);
        });
        ipcMain.handle('get-eth-trunks-for-device', (event, deviceId, snapshotId) => {
            return deviceHandler.getEthTrunksForDevice(deviceId, snapshotId);
        });
        ipcMain.handle('get-port-vlans-for-device', (event, deviceId, snapshotId) => {
            return deviceHandler.getPortVlansForDevice(deviceId, snapshotId);
        });
        ipcMain.handle('get-etrunks-for-device', (event, deviceId, snapshotId) => {
            return deviceHandler.getETrunksForDevice(deviceId, snapshotId);
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

        ipcMain.handle('get-available-reports', () => {
            return exportHandler.getAvailableReports();
        });
        ipcMain.handle('export-report', (event, reportId, snapshotId) => {
            return exportHandler.exportReport(reportId, snapshotId);
        });

        ipcMain.handle('get-all-options-with-types', () => {
            return configurationHandler.getAllOptionsWithTypes();
        });

        ipcMain.handle('update-options', (event, options) => {
            return configurationHandler.updateOptions(options);
        });

        ipcMain.handle('config:is-offline-mode', () => {
            return configurationHandler.isOfflineMode();
        });

        ipcMain.handle('maintenance:clear-data', () => {
            return maintenanceHandler.clearData();
        });

        ipcMain.handle('maintenance:backup-data', () => {
            return maintenanceHandler.backupData();
        });
        ipcMain.handle('maintenance:restore-data', () => {
            return maintenanceHandler.restoreData();
        });
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
