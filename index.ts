// index.ts
import { RootFolderParsingService } from "./backend/src/services";
import { AppDataSource } from "./backend/src/database/data-source";

async function main() {
  console.log("Запуск скрипта...");

  try {
    await AppDataSource.initialize();
    console.log("Источник данных успешно инициализирован!");

    const rootFolderService = new RootFolderParsingService(AppDataSource);
    await rootFolderService.run('/Users/ivanholoburda/Hackathon/logs');
    
    console.log("Скрипт успешно завершен.");

  } catch (error) {
    console.error("Произошла ошибка во время выполнения скрипта:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Соединение с источником данных закрыто.");
    }
  }
}

// Запускаем асинхронную функцию
main();

// import { app, BrowserWindow, ipcMain, dialog } from 'electron';
// import path from 'path';
// import fs from 'fs/promises';
// import { AppDataSource } from './backend/src/database/data-source';

// function createWindow(): void {
//   const mainWindow = new BrowserWindow({
//     width: 1024,
//     height: 700,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//     },
//   });

//   ipcMain.handle('read-file', async () => {
//     const { canceled, filePaths } = await dialog.showOpenDialog({
//       properties: ['openFile'],
//       filters: [{ name: 'Text Files', extensions: ['txt', 'log', 'md'] }],
//     });

//     if (canceled || filePaths.length === 0) {
//       return 'Файл не выбран';
//     }

//     try {
//       const content = await fs.readFile(filePaths[0], 'utf-8');
//       return content;
//     } catch (error) {
//       return `Ошибка чтения файла: ${(error as Error).message}`;
//     }
//   });

//   console.log(process.env.NODE_ENV);
//   if (process.env.NODE_ENV === 'development') {
//     mainWindow.loadURL('http://localhost:5173');
//   } else {
//     mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
//   }
// }

// app.whenReady().then(async () => {
//   try {
//     await AppDataSource.initialize();
//     await AppDataSource.runMigrations();
//     console.log('Database initialized and migrations completed');
//   } catch (error) {
//     console.error('Database initialization failed:', error);
//   }
//   createWindow();
// });

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit();
// });
