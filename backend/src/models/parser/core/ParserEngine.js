const fs = require('fs');
const readline = require('readline');

class ParserEngine {
  constructor(plugins) {
    this.plugins = plugins;
    this.activeParser = null;
  }

  async processFile(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    const results = [];

    for await (const line of rl) {
      if (this.activeParser) {
        if (this.activeParser.isBlockComplete(line)) {
          results.push(this.activeParser.getResult());
          this.activeParser = null;
        } else {
          this.activeParser.parseLine(line);
          continue;
        }
      }

      for (const plugin of this.plugins) {
        // ИЗМЕНЕНИЕ: Мы больше не просто проверяем true/false, а сохраняем результат совпадения (match)
        const match = plugin.isEntryPoint(line);
        if (match) {
          this.activeParser = plugin;
          // ИЗМЕНЕНИЕ: Передаем объект `match` в startBlock, чтобы не парсить строку заново
          this.activeParser.startBlock(line, match);
          break;
        }
      }
    }

    if (this.activeParser) {
      results.push(this.activeParser.getResult());
    }

    return results;
  }
}

module.exports = ParserEngine;