const fs = require('fs').promises;
const path = require('path');
const LogsParserService = require('./LogsParserService');
const { CommonValidationRules, CommonFilters, CommonTransformers } = require('./core/DataValidator');

async function main() {
  console.log('Starting enhanced log parsing...\n');

  const parserService = new LogsParserService();
  const logFilePath = '/Users/ivanholoburda/Hackathon/logs/DeviceA/huawei_config.txt';
  const outputFilePath = 'parsing_results.json';

  try {
    // Настраиваем опции парсинга
    const options = {
      maxErrors: 50,
      continueOnError: true,
      validateResults: true,
      logLevel: 'info'
    };

    console.log('Parsing options:', options);
    console.log('Log file:', logFilePath);
    console.log('Output file:', outputFilePath);

    const results = await parserService.parse(logFilePath, options);
    
    console.log('\n=== Parsing Results ===');
    console.log(`Success: ${results.success}`);
    console.log(`Total blocks parsed: ${results.summary.totalBlocks}`);
    console.log(`Success rate: ${results.summary.successRate}%`);
    console.log(`Block types:`, results.summary.blockTypes);
    console.log(`Parsers used:`, Array.from(results.stats.parsersUsed));
    console.log(`Total errors: ${results.stats.errors}`);
    console.log(`Total warnings: ${results.stats.warnings}`);
    
    if (results.stats.startTime && results.stats.endTime) {
      const duration = new Date(results.stats.endTime) - new Date(results.stats.startTime);
      console.log(`Processing time: ${duration}ms`);
    }

    // Сохраняем результаты
    await fs.writeFile(outputFilePath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${outputFilePath}`);

    // Показываем примеры данных
    if (results.data && results.data.length > 0) {
      console.log('\n=== Sample Data ===');
      const sampleData = results.data.slice(0, 2);
      sampleData.forEach((item, index) => {
        console.log(`\nBlock ${index + 1} (${item.type}):`);
        console.log(`  Interface: ${item.interface || 'N/A'}`);
        console.log(`  State: ${item.state || 'N/A'}`);
        console.log(`  Errors: ${item.errors ? item.errors.length : 0}`);
        console.log(`  Warnings: ${item.warnings ? item.warnings.length : 0}`);
        if (item.statistics && item.statistics.total) {
          console.log(`  Input packets: ${item.statistics.total.input?.packets || 'N/A'}`);
          console.log(`  Output packets: ${item.statistics.total.output?.packets || 'N/A'}`);
        }
      });
    }

    // Показываем статистику парсеров
    const parserStats = parserService.getParserStats();
    console.log('\n=== Parser Statistics ===');
    parserStats.forEach(stat => {
      console.log(`${stat.name}: priority=${stat.priority}, active=${stat.isActive}`);
    });

  } catch (error) {
    console.error(`\nCritical Error: ${error.message}`);
    console.error('Stack trace:', error.stack);
    
    // Сохраняем информацию об ошибке
    const errorInfo = {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      file: logFilePath
    };
    
    await fs.writeFile('parsing_error.json', JSON.stringify(errorInfo, null, 2));
    console.log('Error information saved to: parsing_error.json');
  }
}

// Запускаем парсинг
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  LogsParserService,
  CommonValidationRules,
  CommonFilters,
  CommonTransformers
};
