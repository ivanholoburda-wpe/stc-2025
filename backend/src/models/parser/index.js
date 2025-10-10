const path = require('path');
const LogsParserService = require('./services/LogsParserService');

async function main() {
  console.log('Starting log parsing...\n');

  const parserService = new LogsParserService();
  const logFilePath = path.join(__dirname, 'logs', 'huawei_config.txt');

  try {
    const results = await parserService.parse(logFilePath);
    console.log('\nParsing results:');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(`\nError: ${error.message}`);
  }
}

main();