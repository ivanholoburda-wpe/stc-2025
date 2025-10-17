import {app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import {AppDataSource} from './backend/src/database/data-source';
import {container} from './backend/src/container';
import {ParsingHandler} from './backend/src/handlers/ParsingHandler';
import {DeviceHandler} from './backend/src/handlers/DeviceHandler';
import {SnapshotHandler} from "./backend/src/handlers/SnapshotHandler";
import { TYPES } from './backend/src/types';
import { DefaultOptionsSeeder } from './backend/src/services/seeders/OptionsSeeder';

function createWindow(): void {
    const mainWindow = new BrowserWindow({
        width: 1024,
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

        ipcMain.handle('run-parsing', async () => {
            return await parsingHandler.startParsing();
        })

        ipcMain.handle('get-devices', async () => {
            return await deviceHandler.getAllDevices();
        });

        ipcMain.handle('get-snapshots', async () => {
            return await snapshotHandler.getAllSnapshots();
        })

        ipcMain.handle('analyze-snapshot', async (event, snapshotId, prompt) => {
            return await snapshotHandler.analyzeSnapshot(snapshotId, prompt);
        })
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
