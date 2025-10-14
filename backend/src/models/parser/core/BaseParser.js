const { globalLogger, globalPerformanceTracker } = require('./Logger');

/**
 * Базовый класс для всех парсеров с улучшенной обработкой ошибок
 * и поддержкой множественных типов данных
 */
class BaseParser {
  constructor() {
    this.name = 'base_parser';
    this.priority = 999;
    this.data = null;
    this.errors = [];
    this.warnings = [];
    this.stats = {
      linesProcessed: 0,
      rulesMatched: 0,
      errorsCount: 0,
      warningsCount: 0,
      startTime: null,
      endTime: null
    };
    this.rules = [];
    this.validationRules = [];
    this.isActive = false;
    this.logger = globalLogger;
    this.performanceTracker = globalPerformanceTracker;
  }

  /**
   * Проверяет, является ли строка точкой входа для парсера
   * @param {string} line - строка для проверки
   * @returns {Object|null} - результат совпадения или null
   */
  isEntryPoint(line) {
    throw new Error('isEntryPoint method must be implemented by subclass');
  }

  /**
   * Инициализирует блок данных для парсинга
   * @param {string} line - строка инициализации
   * @param {Object} match - результат совпадения
   */
  startBlock(line, match) {
    this.isActive = true;
    
    // Инициализируем stats если не инициализированы
    if (!this.stats) {
      this.stats = {
        linesProcessed: 0,
        rulesMatched: 0,
        errorsCount: 0,
        warningsCount: 0,
        startTime: null,
        endTime: null
      };
    }
    
    this.stats.startTime = new Date();
    if (this.performanceTracker && this.performanceTracker.startTimer) {
      this.performanceTracker.startTimer(`parser_${this.name}_block`);
    }
    
    this.data = {
      type: this.name,
      raw_line: line.trim(),
      parsed_at: new Date().toISOString(),
      errors: [],
      warnings: []
    };
    this.errors = [];
    this.warnings = [];
    this.stats.linesProcessed = 0;
    this.stats.rulesMatched = 0;
    
    if (this.logger && this.logger.debug) {
      this.logger.debug(`Started parsing block with ${this.name}`, {
        parser: this.name,
        line: line.trim().substring(0, 100),
        match: match ? match.groups : null
      });
    }
  }

  /**
   * Парсит строку с обработкой ошибок
   * @param {string} line - строка для парсинга
   * @returns {boolean} - true если строка была обработана
   */
  parseLine(line) {
    if (!this.isActive || !this.data) {
      return false;
    }

    this.stats.linesProcessed++;
    const trimmedLine = line.trim();

    // Пропускаем пустые строки
    if (!trimmedLine) {
      return true;
    }

    try {
      // Пытаемся применить правила парсинга
      for (const rule of this.rules) {
        try {
          const match = trimmedLine.match(rule.regex);
          if (match) {
            this.stats.rulesMatched++;
            rule.handler.call(this, match, trimmedLine);
            return true;
          }
        } catch (error) {
          this._addError(`Error in rule "${rule.name}": ${error.message}`, trimmedLine);
        }
      }

      // Если ни одно правило не сработало, проверяем на мусорные данные
      if (this._isGarbageData(trimmedLine)) {
        this._addWarning(`Skipped garbage data: ${trimmedLine}`, trimmedLine);
        return true;
      }

      // Если это не мусор, но и не подходящее правило - добавляем предупреждение
      this._addWarning(`Unrecognized line format: ${trimmedLine}`, trimmedLine);
      return true;

    } catch (error) {
      this._addError(`Unexpected error parsing line: ${error.message}`, trimmedLine);
      return true;
    }
  }

  /**
   * Проверяет, завершен ли блок парсинга
   * @param {string} line - строка для проверки
   * @returns {boolean} - true если блок завершен
   */
  isBlockComplete(line) {
    const trimmedLine = line.trim();
    
    // Базовые условия завершения блока
    if (!trimmedLine) return true;
    if (trimmedLine.startsWith('<')) return true;
    if (this.isEntryPoint(trimmedLine)) return true;
    
    return false;
  }

  /**
   * Получает результат парсинга с валидацией
   * @returns {Object} - результат парсинга
   */
  getResult() {
    if (!this.data) {
      return null;
    }

    this.stats.endTime = new Date();
    let performanceMetric = null;
    if (this.performanceTracker && this.performanceTracker.endTimer) {
      performanceMetric = this.performanceTracker.endTimer(`parser_${this.name}_block`, {
        parser: this.name,
        linesProcessed: this.stats.linesProcessed,
        rulesMatched: this.stats.rulesMatched
      });
    }

    // Добавляем статистику и ошибки к результату
    this.data.stats = { 
      ...this.stats,
      processingTime: performanceMetric ? performanceMetric.duration : 0
    };
    this.data.errors = [...this.errors];
    this.data.warnings = [...this.warnings];

    // Валидация данных
    this._validateData();

    if (this.logger && this.logger.debug) {
      this.logger.debug(`Completed parsing block with ${this.name}`, {
        parser: this.name,
        linesProcessed: this.stats.linesProcessed,
        rulesMatched: this.stats.rulesMatched,
        errors: this.stats.errorsCount,
        warnings: this.stats.warningsCount,
        processingTime: performanceMetric ? performanceMetric.duration : 0
      });
    }

    this.isActive = false;
    return this.data;
  }

  /**
   * Проверяет, является ли строка мусорными данными
   * @param {string} line - строка для проверки
   * @returns {boolean} - true если это мусорные данные
   */
  _isGarbageData(line) {
    // Паттерны мусорных данных
    const garbagePatterns = [
      /^\s*$/, // пустые строки
      /^Error:/, // ошибки команд
      /^\^/, // символы ошибок
      /^Unrecognized command/, // нераспознанные команды
      /^Wrong parameter/, // неправильные параметры
      /^Current system time:/, // системное время (не критично)
      /^IP Sending Frames/, // техническая информация
    ];

    return garbagePatterns.some(pattern => pattern.test(line));
  }

  /**
   * Добавляет ошибку
   * @param {string} message - сообщение об ошибке
   * @param {string} line - строка, вызвавшая ошибку
   */
  _addError(message, line = '') {
    const error = {
      message,
      line: line.substring(0, 100), // ограничиваем длину
      timestamp: new Date().toISOString()
    };
    this.errors.push(error);
    this.stats.errorsCount++;
    
    if (this.logger && this.logger.error) {
      this.logger.error(`Parser ${this.name} error: ${message}`, {
        parser: this.name,
        line: line.substring(0, 100),
        errorCount: this.stats.errorsCount
      });
    }
  }

  /**
   * Добавляет предупреждение
   * @param {string} message - сообщение предупреждения
   * @param {string} line - строка, вызвавшая предупреждение
   */
  _addWarning(message, line = '') {
    const warning = {
      message,
      line: line.substring(0, 100),
      timestamp: new Date().toISOString()
    };
    this.warnings.push(warning);
    this.stats.warningsCount++;
    
    if (this.logger && this.logger.warn) {
      this.logger.warn(`Parser ${this.name} warning: ${message}`, {
        parser: this.name,
        line: line.substring(0, 100),
        warningCount: this.stats.warningsCount
      });
    }
  }

  /**
   * Валидирует данные после парсинга
   */
  _validateData() {
    if (!this.data) return;

    // Базовая валидация
    if (!this.data.type) {
      this._addError('Missing data type');
    }

    // Применяем пользовательские правила валидации
    for (const rule of this.validationRules) {
      try {
        if (!rule.validate(this.data)) {
          this._addError(rule.message || 'Validation failed');
        }
      } catch (error) {
        this._addError(`Validation error: ${error.message}`);
      }
    }
  }

  /**
   * Добавляет правило валидации
   * @param {Object} rule - правило валидации
   */
  addValidationRule(rule) {
    this.validationRules.push(rule);
  }

  /**
   * Сбрасывает состояние парсера
   */
  reset() {
    this.data = null;
    this.errors = [];
    this.warnings = [];
    this.isActive = false;
    this.stats = {
      linesProcessed: 0,
      rulesMatched: 0,
      errorsCount: 0,
      warningsCount: 0
    };
  }

  /**
   * Получает статистику парсера
   * @returns {Object} - статистика
   */
  getStats() {
    return {
      name: this.name,
      priority: this.priority,
      isActive: this.isActive,
      stats: { ...this.stats }
    };
  }
}

module.exports = BaseParser;
