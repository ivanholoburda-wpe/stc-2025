import {app, BrowserWindow, ipcMain, dialog} from 'electron';
import path from 'path';
import {AppDataSource} from './backend/src/database/data-source';
import {container} from './backend/src/container';
import {ParsingHandler} from './backend/src/handlers/ParsingHandler';
import {DeviceHandler} from './backend/src/handlers/DeviceHandler';
import {IAIClient} from './backend/src/services/ai-agent/client/IAIClient';
import {TYPES} from './backend/src/types';
import {ISnapshotRepository, SnapshotRepository} from "./backend/src/repositories/SnapshotRepository";
import {AIAgent} from "./backend/src/services/ai-agent/AIAgent";

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

        const parsingHandler = container.get(ParsingHandler);
        const deviceHandler = container.get(DeviceHandler);

        ipcMain.handle('run-parsing', async () => {
            return await parsingHandler.startParsing();
        })

        ipcMain.handle('get-devices', async () => {
            return await deviceHandler.getAllDevices();
        });
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
