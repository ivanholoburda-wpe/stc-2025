import 'reflect-metadata';
import { AppDataSource } from './database/data-source';
import { RootFolderParsingService } from './services';
import * as fs from 'fs'; // <-- ДОБАВЛЕНО: для проверки папки

async function main() {
  console.log('[DEBUG] Скрипт запущен.'); // <-- ДОБАВЛЕНО: самая первая проверка

  const rootFolder = 'C:\\logs-root'; 

  // <-- ДОБАВЛЕНО: Проверяем, существует ли папка, перед тем как что-то делать
  if (!fs.existsSync(rootFolder)) {
    console.error(`[FATAL] Директория не найдена по пути: ${rootFolder}`);
    process.exit(1);
  }

  const spinner = (text: string) => ({
      succeed: (msg: string) => console.log(`✅ ${text}: ${msg}`),
      fail: (msg: string) => console.error(`❌ ${text}: ${msg}`)
  });

  const dbSpinner = spinner('База данных');
  try {
    console.log('[DEBUG] Попытка инициализации AppDataSource...');
    await AppDataSource.initialize();
    dbSpinner.succeed('Соединение установлено.');
  } catch (dbError) {
    dbSpinner.fail('Ошибка подключения!');
    throw dbError; // Пробрасываем ошибку дальше, чтобы ее поймал главный catch
  }

  const migrationSpinner = spinner('Миграции');
  try {
    console.log('[DEBUG] Попытка запуска миграций...');
    await AppDataSource.runMigrations();
    migrationSpinner.succeed('Миграции успешно применены.');
  } catch (migrationError) {
    migrationSpinner.fail('Ошибка применения миграций!');
    throw migrationError;
  }
  
  console.log('-----------------------------------------');
  console.log(`[INFO] Начинаю парсинг директории: ${rootFolder}`);
  
  const service = new RootFolderParsingService(AppDataSource);
  const result = await service.run(rootFolder);

  console.log('---------- РЕЗУЛЬТАТ ПАРСИНГА ----------');
  console.log('Snapshot ID:', result.snapshotId);
  
  // <-- ВАЖНО: Используй console.table для красивого вывода массива объектов
  if (result.devices && result.devices.length > 0) {
    console.log('Обработанные устройства:');
    console.table(result.devices);
  } else {
    console.log('Устройства не были обработаны или не найдены.');
  }
  console.log('-----------------------------------------');

  await AppDataSource.destroy();
  console.log('[DEBUG] Соединение с БД закрыто.');
}

main().catch((e) => {
  // <-- УЛУЧШЕНО: Выводим полный объект ошибки
  console.error('====================================');
  console.error('[FATAL] Выполнение прервалось с ошибкой:');
  console.error(e); // Выведет полный стек ошибки, а не только сообщение
  console.error('====================================');
  process.exit(1);
});