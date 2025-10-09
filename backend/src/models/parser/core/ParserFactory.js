const fs = require('fs');
const path = require('path');

class ParserFactory {
  constructor() {
    this.parsers = this._loadParsers();
  }

  _loadParsers() {
    const parsersPath = path.join(__dirname, '../parsers');
    const loadedParsers = [];
    if (!fs.existsSync(parsersPath)) {
      console.error(`Directory for parsers not found: ${parsersPath}`);
      return [];
    }
    const parserFiles = fs.readdirSync(parsersPath).filter(file => file.endsWith('.js'));

    for (const file of parserFiles) {
      const filePath = path.join(parsersPath, file);
      try {
        const parser = require(filePath);
        if (typeof parser.isEntryPoint === 'function') {
          loadedParsers.push(parser);
        }
      } catch (error) {
        console.error(`Error loading parser "${file}":`, error);
      }
    }

    loadedParsers.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    console.log('All parsers loaded and sorted successfully.');
    return loadedParsers;
  }

  getParserForHeader(headerLines) {
    for (const parser of this.parsers) {
      for (const line of headerLines) {
        if (parser.isEntryPoint(line)) {
          console.log(`Found suitable parser: ${parser.name}`);
          return parser;
        }
      }
    }
    console.warn('Parser not found for the given log.');
    return null;
  }
}

module.exports = ParserFactory;
