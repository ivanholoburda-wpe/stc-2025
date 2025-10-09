const fs = require('fs');
const path = require('path');

class ParserLoader {
  constructor() {
    this.parsersPath = path.join(__dirname, '../parsers');
  }

  load() {
    const loadedParsers = [];
    const parserFiles = fs.readdirSync(this.parsersPath).filter(file => file.endsWith('.js'));

    for (const file of parserFiles) {
      const filePath = path.join(this.parsersPath, file);
      try {
        const parser = require(filePath);
        if (typeof parser.isEntryPoint === 'function') {
          loadedParsers.push(parser);
          console.log(`Parser "${file}" loaded successfully.`);
        }
      } catch (error) {
        console.error(`Error while loading parser "${file}":`, error);
      }
    }
    return loadedParsers;
  }
}

module.exports = ParserLoader;