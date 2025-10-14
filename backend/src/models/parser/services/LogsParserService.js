const fs = require('fs');
const readline = require('readline');
const ParserFactory = require('../core/ParserFactory');
const { globalLogger, globalPerformanceTracker } = require('../core/Logger');

class LogsParserService {
  constructor() {
    this.factory = new ParserFactory();
    this.logger = globalLogger;
    this.performanceTracker = globalPerformanceTracker;
    this.globalStats = {
      totalLines: 0,
      parsedBlocks: 0,
      errors: 0,
      warnings: 0,
      parsersUsed: new Set(),
      startTime: null,
      endTime: null
    };
  }

  async _readFileHeader(filePath, lineCount = 20) {
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

  async parse(filePath, options = {}) {
    this.globalStats.startTime = new Date();
    this.performanceTracker.startTimer('total_parsing');
    
    this.logger.info(`Starting log parsing`, {
      filePath,
      options
    });
    
    const {
      maxErrors = 100,
      continueOnError = true,
      validateResults = true,
      logLevel = 'info'
    } = options;

    const header = await this._readFileHeader(filePath);
    if (header.length === 0) {
      this.logger.warn('File is empty');
      return this._createEmptyResult();
    }

    // Получаем все доступные парсеры
    const availableParsers = this.factory.getAllParsers();
    this.logger.info(`Available parsers: ${availableParsers.map(p => p.name).join(', ')}`);

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    
    const results = [];
    const activeParsers = new Map(); // Поддержка множественных активных парсеров
    let consecutiveErrors = 0;

    try {
      for await (const line of rl) {
        this.globalStats.totalLines++;
        
        // Проверяем завершение блоков для всех активных парсеров
        for (const [parserName, parser] of activeParsers) {
          if (parser.isBlockComplete(line)) {
            const result = parser.getResult();
            if (result && this._isValidResult(result)) {
              results.push(result);
              this.globalStats.parsedBlocks++;
              this.globalStats.parsersUsed.add(parserName);
            }
            activeParsers.delete(parserName);
          } else {
            try {
              parser.parseLine(line);
            } catch (error) {
              this.logger.error(`Error in parser ${parserName}`, {
                parser: parserName,
                error: error.message,
                line: line.substring(0, 100),
                consecutiveErrors
              });
              
              if (!continueOnError) {
                throw error;
              }
              consecutiveErrors++;
              if (consecutiveErrors >= maxErrors) {
                this.logger.error(`Too many consecutive errors (${maxErrors}), stopping parsing`);
                break;
              }
            }
          }
        }

        // Если слишком много ошибок подряд, останавливаемся
        if (consecutiveErrors >= maxErrors) {
          break;
        }

        // Ищем новые точки входа для всех парсеров
        for (const parser of availableParsers) {
          try {
            const match = parser.isEntryPoint(line);
            if (match) {
              this.logger.info(`Found entry point for ${parser.name}`, {
                parser: parser.name,
                line: line.trim().substring(0, 100),
                match: match.groups || 'no groups'
              });
              
              // Создаем новый экземпляр парсера для каждого блока
              const parserInstance = this.factory.createParserInstance(parser.name);
              if (parserInstance) {
                parserInstance.startBlock(line, match);
                activeParsers.set(`${parser.name}_${Date.now()}`, parserInstance);
                this.logger.debug(`Started parsing block with ${parser.name}`, {
                  parser: parser.name,
                  line: line.trim().substring(0, 100)
                });
                consecutiveErrors = 0; // Сбрасываем счетчик ошибок при успешном старте
              }
            }
          } catch (error) {
            this.logger.error(`Error checking entry point for ${parser.name}`, {
              parser: parser.name,
              error: error.message,
              line: line.substring(0, 100)
            });
            if (!continueOnError) {
              throw error;
            }
          }
        }
      }

      // Завершаем все активные парсеры
      for (const [parserName, parser] of activeParsers) {
        const result = parser.getResult();
        if (result && this._isValidResult(result)) {
          results.push(result);
          this.globalStats.parsedBlocks++;
          this.globalStats.parsersUsed.add(parserName);
        }
      }

    } catch (error) {
      console.error(`Critical parsing error: ${error.message}`);
      if (!continueOnError) {
        throw error;
      }
    } finally {
      rl.close();
      fileStream.close();
      this.globalStats.endTime = new Date();
      
      const performanceMetric = this.performanceTracker.endTimer('total_parsing', {
        totalLines: this.globalStats.totalLines,
        parsedBlocks: this.globalStats.parsedBlocks,
        parsersUsed: Array.from(this.globalStats.parsersUsed)
      });
      
      this.globalStats.processingTime = performanceMetric ? performanceMetric.duration : 0;
    }

    // Подсчитываем общую статистику ошибок и предупреждений
    this._calculateGlobalStats(results);

    const finalResult = {
      success: true,
      data: results,
      stats: this.globalStats,
      summary: this._createSummary(results)
    };

    this.logger.info(`Parsing completed successfully`, {
      totalLines: this.globalStats.totalLines,
      parsedBlocks: this.globalStats.parsedBlocks,
      parsersUsed: Array.from(this.globalStats.parsersUsed),
      totalErrors: this.globalStats.errors,
      totalWarnings: this.globalStats.warnings,
      processingTime: this.globalStats.processingTime,
      successRate: finalResult.summary.successRate
    });

    return finalResult;
  }

  _isValidResult(result) {
    if (!result || typeof result !== 'object') {
      return false;
    }
    
    // Проверяем базовые поля
    if (!result.type) {
      return false;
    }

    // Если есть критические ошибки, считаем результат невалидным
    if (result.errors && result.errors.length > 0) {
      const criticalErrors = result.errors.filter(error => 
        error.message.includes('Critical') || 
        error.message.includes('Missing required')
      );
      return criticalErrors.length === 0;
    }

    return true;
  }

  _calculateGlobalStats(results) {
    this.globalStats.errors = 0;
    this.globalStats.warnings = 0;

    results.forEach(result => {
      if (result.errors) {
        this.globalStats.errors += result.errors.length;
      }
      if (result.warnings) {
        this.globalStats.warnings += result.warnings.length;
      }
    });
  }

  _createSummary(results) {
    const summary = {
      totalBlocks: results.length,
      blockTypes: {},
      errorBlocks: 0,
      warningBlocks: 0,
      successRate: 0
    };

    results.forEach(result => {
      // Подсчет типов блоков
      if (!summary.blockTypes[result.type]) {
        summary.blockTypes[result.type] = 0;
      }
      summary.blockTypes[result.type]++;

      // Подсчет блоков с ошибками и предупреждениями
      if (result.errors && result.errors.length > 0) {
        summary.errorBlocks++;
      }
      if (result.warnings && result.warnings.length > 0) {
        summary.warningBlocks++;
      }
    });

    summary.successRate = results.length > 0 
      ? ((results.length - summary.errorBlocks) / results.length * 100).toFixed(2)
      : 0;

    return summary;
  }

  _createEmptyResult() {
    return {
      success: true,
      data: [],
      stats: this.globalStats,
      summary: {
        totalBlocks: 0,
        blockTypes: {},
        errorBlocks: 0,
        warningBlocks: 0,
        successRate: 100
      }
    };
  }

  /**
   * Получает статистику всех парсеров
   */
  getParserStats() {
    return this.factory.getAllParsers().map(parser => parser.getStats());
  }

  /**
   * Сбрасывает статистику
   */
  resetStats() {
    this.globalStats = {
      totalLines: 0,
      parsedBlocks: 0,
      errors: 0,
      warnings: 0,
      parsersUsed: new Set(),
      startTime: null,
      endTime: null
    };
  }
}

module.exports = LogsParserService;