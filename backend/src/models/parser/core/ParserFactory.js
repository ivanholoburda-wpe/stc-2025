const fs = require('fs');
const path = require('path');
const BaseParser = require('./BaseParser');

class ParserFactory {
  constructor() {
    this.parserClasses = new Map(); // Кэш классов парсеров
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
        
        // Проверяем, является ли парсер экземпляром или классом
        if (parser.prototype && parser.prototype.isEntryPoint) {
          // Это класс парсера - создаем экземпляр для совместимости
          const parserName = parser.name || file.replace('.js', '');
          this.parserClasses.set(parserName, parser);
          
          // Создаем экземпляр для обратной совместимости
          const parserInstance = new parser();
          loadedParsers.push(parserInstance);
          console.log(`Parser class "${file}" loaded successfully.`);
        } else if (typeof parser.isEntryPoint === 'function') {
          // Это экземпляр парсера (старый формат)
          loadedParsers.push(parser);
          console.log(`Parser instance "${file}" loaded successfully.`);
        } else {
          console.warn(`Parser "${file}" does not implement required methods.`);
        }
      } catch (error) {
        console.error(`Error loading parser "${file}":`, error);
      }
    }

    // Сортируем по приоритету
    loadedParsers.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    console.log(`Total parsers loaded: ${loadedParsers.length} instances, ${this.parserClasses.size} classes`);
    return loadedParsers;
  }

  /**
   * Получает все доступные парсеры (экземпляры)
   */
  getAllParsers() {
    return [...this.parsers];
  }

  /**
   * Получает все классы парсеров
   */
  getAllParserClasses() {
    return Array.from(this.parserClasses.values());
  }

  /**
   * Создает новый экземпляр парсера по имени
   * @param {string} parserName - имя парсера
   * @returns {Object|null} - новый экземпляр парсера
   */
  createParserInstance(parserName) {
    const ParserClass = this.parserClasses.get(parserName);
    if (ParserClass) {
      try {
        return new ParserClass();
      } catch (error) {
        console.error(`Error creating parser instance "${parserName}":`, error);
        return null;
      }
    }
    
    // Если класс не найден, ищем среди экземпляров
    const parserInstance = this.parsers.find(p => p.name === parserName);
    if (parserInstance) {
      // Создаем новый экземпляр того же класса
      const ParserClass = parserInstance.constructor;
      try {
        return new ParserClass();
      } catch (error) {
        console.error(`Error creating parser instance from existing "${parserName}":`, error);
        return null;
      }
    }
    
    console.warn(`Parser "${parserName}" not found`);
    return null;
  }

  /**
   * Автоматически определяет подходящие парсеры для заголовка лога
   * @param {Array} headerLines - строки заголовка
   * @returns {Array} - массив подходящих парсеров
   */
  getParsersForHeader(headerLines) {
    const suitableParsers = [];
    
    for (const parser of this.parsers) {
      try {
        for (const line of headerLines) {
          if (parser.isEntryPoint(line)) {
            suitableParsers.push({
              parser,
              confidence: this._calculateConfidence(parser, headerLines),
              matchedLine: line
            });
            break;
          }
        }
      } catch (error) {
        console.error(`Error checking parser "${parser.name}":`, error);
      }
    }

    // Сортируем по уверенности и приоритету
    suitableParsers.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      return (a.parser.priority || 999) - (b.parser.priority || 999);
    });

    return suitableParsers;
  }

  /**
   * Вычисляет уверенность в том, что парсер подходит для лога
   * @param {Object} parser - парсер
   * @param {Array} headerLines - строки заголовка
   * @returns {number} - уровень уверенности (0-1)
   */
  _calculateConfidence(parser, headerLines) {
    let matches = 0;
    let totalChecks = 0;

    for (const line of headerLines) {
      totalChecks++;
      if (parser.isEntryPoint(line)) {
        matches++;
      }
    }

    // Базовая уверенность
    let confidence = matches / totalChecks;

    // Бонус за специфичность парсера
    if (parser.priority && parser.priority < 50) {
      confidence += 0.1;
    }

    // Бонус за наличие валидационных правил
    if (parser.validationRules && parser.validationRules.length > 0) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Получает парсер по имени
   * @param {string} name - имя парсера
   * @returns {Object|null} - парсер или null
   */
  getParserByName(name) {
    return this.parsers.find(p => p.name === name) || null;
  }

  /**
   * Получает класс парсера по имени
   * @param {string} name - имя класса парсера
   * @returns {Function|null} - класс парсера или null
   */
  getParserClassByName(name) {
    return this.parserClasses.get(name) || null;
  }

  /**
   * Регистрирует новый парсер
   * @param {Object|Function} parser - парсер (экземпляр или класс)
   */
  registerParser(parser) {
    if (parser.prototype && parser.prototype.isEntryPoint) {
      // Это класс парсера
      this.parserClasses.set(parser.name || 'unnamed', parser);
      console.log(`Parser class "${parser.name}" registered successfully.`);
    } else if (typeof parser.isEntryPoint === 'function') {
      // Это экземпляр парсера
      this.parsers.push(parser);
      this.parsers.sort((a, b) => (a.priority || 999) - (b.priority || 999));
      console.log(`Parser instance "${parser.name}" registered successfully.`);
    } else {
      throw new Error('Parser must be either an instance with isEntryPoint method or a class extending BaseParser');
    }
  }

  /**
   * Получает статистику всех парсеров
   */
  getParserStats() {
    return {
      totalInstances: this.parsers.length,
      totalClasses: this.parserClasses.size,
      parsers: this.parsers.map(p => ({
        name: p.name,
        priority: p.priority || 999,
        hasValidation: !!(p.validationRules && p.validationRules.length > 0)
      })),
      classes: Array.from(this.parserClasses.keys())
    };
  }

  /**
   * Перезагружает все парсеры
   */
  reloadParsers() {
    // Очищаем кэш модулей
    Object.keys(require.cache).forEach(key => {
      if (key.includes(path.join(__dirname, '../parsers'))) {
        delete require.cache[key];
      }
    });

    this.parsers = [];
    this.parserClasses.clear();
    this._loadParsers();
    console.log('All parsers reloaded successfully.');
  }
}

module.exports = ParserFactory;
