const path = require('path');
const PluginLoader = require('./core/PluginLoader');
const ParserEngine = require('./core/ParserEngine');

async function main() {
  console.log('--- Запуск гибкого парсера ---');

  // 1. Динамически загружаем все плагины из папки /plugins
  const loader = new PluginLoader();
  const plugins = loader.load();

  if (plugins.length === 0) {
    console.error('Не найдено ни одного плагина. Проверьте папку /plugins.');
    return;
  }

  // 2. Создаем и запускаем движок
  const engine = new ParserEngine(plugins);
  const logFilePath = path.join(__dirname, 'logs', 'huawei_config.txt');
  
  console.log(`\n📄 Начинаю обработку файла: ${logFilePath}\n`);
  const results = await engine.processFile(logFilePath);

  // 3. Выводим результат
  console.log('--- Результаты парсинга ---');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);