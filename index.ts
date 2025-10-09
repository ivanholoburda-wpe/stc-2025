import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { AppDataSource } from './backend/src/database/data-source';
import { container } from './backend/src/container';
import { DeviceHandler } from './backend/src/handlers/DeviceHandler';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 700,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
    },
  });

  ipcMain.handle('read-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Text Files', extensions: ['txt', 'log', 'md'] }],
    });

    if (canceled || filePaths.length === 0) {
      return 'Файл не выбран';
    }

    try {
      const content = await fs.readFile(filePaths[0], 'utf-8');
      return content;
    } catch (error) {
      return `Ошибка чтения файла: ${(error as Error).message}`;
    }
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

    // Initialize DI container and handlers
    const deviceHandler = container.get(DeviceHandler);

    // IPC handlers
    ipcMain.handle('get-devices', async () => {
      return await deviceHandler.getAllDevices();
    });

    ipcMain.handle('get-device-by-id', async (event, id: number) => {
      return await deviceHandler.getDeviceById(id);
    });

    ipcMain.handle('create-device', async (event, deviceData: any) => {
      return await deviceHandler.createDevice(deviceData);
    });

  } catch (error) {
    console.error('Database initialization failed:', error);
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
