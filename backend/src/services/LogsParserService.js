const fs = require('fs');
const readline = require('readline');
const ParserFactory = require('../core/ParserFactory');

class LogsParserService {
  constructor() {
    this.factory = new ParserFactory();
  }

  async _readFileHeader(filePath, lineCount = 10) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    const lines = [];
    for await (const line of rl) {
      lines.push(line);
      if (lines.length >= lineCount) {
        break;
      }
    }
    rl.close();
    fileStream.close();
    return lines;
  }

  async parse(filePath) {
    const header = await this._readFileHeader(filePath);
    if (header.length === 0) {
      console.log('File is empty.');
      return [];
    }

    const parser = this.factory.getParserForHeader(header);
    if (!parser) {
      throw new Error('Parser not found for the given log.');
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    
    const results = [];
    let activeParser = null;

    for await (const line of rl) {
      if (activeParser) {
        if (activeParser.isBlockComplete(line)) {
          results.push(activeParser.getResult());
          activeParser = null;
        } else {
          activeParser.parseLine(line);
          continue;
        }
      }

      const match = parser.isEntryPoint(line);
      if (match) {
        activeParser = parser;
        activeParser.startBlock(line, match);
      }
    }

    if (activeParser) {
      results.push(activeParser.getResult());
    }

    return results;
  }
}

module.exports = LogsParserService;