/**
 * Система логирования и статистики для парсеров
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile || false;
    this.filePath = options.filePath || 'parser.log';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    this.stats = {
      totalLogs: 0,
      logsByLevel: {},
      errors: [],
      warnings: [],
      performance: []
    };
  }

  /**
   * Логирует сообщение
   * @param {string} level - уровень логирования
   * @param {string} message - сообщение
   * @param {Object} meta - дополнительные метаданные
   */
  log(level, message, meta = {}) {
    if (this.levels[level] > this.levels[this.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      meta,
      pid: process.pid
    };

    // Обновляем статистику
    this.stats.totalLogs++;
    if (!this.stats.logsByLevel[level]) {
      this.stats.logsByLevel[level] = 0;
    }
    this.stats.logsByLevel[level]++;

    // Сохраняем ошибки и предупреждения
    if (level === 'error') {
      this.stats.errors.push(logEntry);
    } else if (level === 'warn') {
      this.stats.warnings.push(logEntry);
    }

    // Выводим в консоль
    if (this.enableConsole) {
      this._logToConsole(logEntry);
    }

    // Записываем в файл
    if (this.enableFile) {
      this._logToFile(logEntry);
    }
  }

  /**
   * Логирует ошибку
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Логирует предупреждение
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Логирует информационное сообщение
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Логирует отладочную информацию
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Выводит лог в консоль
   */
  _logToConsole(logEntry) {
    const { timestamp, level, message, meta } = logEntry;
    const time = timestamp.split('T')[1].split('.')[0];
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    
    const colors = {
      error: '\x1b[31m', // red
      warn: '\x1b[33m',  // yellow
      info: '\x1b[36m', // cyan
      debug: '\x1b[90m' // gray
    };
    
    const reset = '\x1b[0m';
    const color = colors[level] || '';
    
    console.log(`${color}[${time}] ${level.toUpperCase()}: ${message}${metaStr}${reset}`);
  }

  /**
   * Записывает лог в файл
   */
  async _logToFile(logEntry) {
    try {
      const fs = require('fs').promises;
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Проверяем размер файла и ротируем при необходимости
      await this._rotateLogFile();
      
      await fs.appendFile(this.filePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Ротирует лог файл при превышении размера
   */
  async _rotateLogFile() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const stats = await fs.stat(this.filePath).catch(() => null);
      if (!stats || stats.size < this.maxFileSize) {
        return;
      }

      // Переименовываем существующие файлы
      for (let i = this.maxFiles - 1; i > 0; i--) {
        const oldFile = `${this.filePath}.${i}`;
        const newFile = `${this.filePath}.${i + 1}`;
        
        try {
          await fs.rename(oldFile, newFile);
        } catch (error) {
          // Игнорируем ошибки если файл не существует
        }
      }

      // Переименовываем текущий файл
      await fs.rename(this.filePath, `${this.filePath}.1`);
    } catch (error) {
      console.error('Failed to rotate log file:', error.message);
    }
  }

  /**
   * Получает статистику логирования
   */
  getStats() {
    return {
      ...this.stats,
      recentErrors: this.stats.errors.slice(-10),
      recentWarnings: this.stats.warnings.slice(-10)
    };
  }

  /**
   * Очищает статистику
   */
  clearStats() {
    this.stats = {
      totalLogs: 0,
      logsByLevel: {},
      errors: [],
      warnings: [],
      performance: []
    };
  }
}

/**
 * Система сбора статистики производительности
 */
class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
  }

  /**
   * Начинает измерение времени
   * @param {string} name - имя метрики
   */
  startTimer(name) {
    this.timers.set(name, {
      start: process.hrtime.bigint(),
      startMemory: process.memoryUsage()
    });
  }

  /**
   * Завершает измерение времени
   * @param {string} name - имя метрики
   * @param {Object} meta - дополнительные метаданные
   */
  endTimer(name, meta = {}) {
    const timer = this.timers.get(name);
    if (!timer) {
      console.warn(`Timer "${name}" was not started`);
      return;
    }

    const end = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(end - timer.start) / 1000000; // в миллисекундах
    const memoryDelta = {
      rss: endMemory.rss - timer.startMemory.rss,
      heapUsed: endMemory.heapUsed - timer.startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - timer.startMemory.heapTotal
    };

    const metric = {
      name,
      duration,
      memoryDelta,
      timestamp: new Date().toISOString(),
      meta
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push(metric);
    this.timers.delete(name);

    return metric;
  }

  /**
   * Записывает метрику
   * @param {string} name - имя метрики
   * @param {number} value - значение
   * @param {Object} meta - дополнительные метаданные
   */
  recordMetric(name, value, meta = {}) {
    const metric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      meta
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push(metric);
  }

  /**
   * Получает статистику по метрике
   * @param {string} name - имя метрики
   */
  getMetricStats(name) {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value || m.duration);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      name,
      count: metrics.length,
      sum,
      average: avg,
      min,
      max,
      lastValue: values[values.length - 1],
      recentValues: values.slice(-10)
    };
  }

  /**
   * Получает общую статистику
   */
  getOverallStats() {
    const stats = {};
    
    for (const [name, metrics] of this.metrics) {
      stats[name] = this.getMetricStats(name);
    }

    return {
      totalMetrics: this.metrics.size,
      activeTimers: this.timers.size,
      stats
    };
  }

  /**
   * Очищает метрики
   */
  clearMetrics() {
    this.metrics.clear();
    this.timers.clear();
  }
}

/**
 * Глобальный экземпляр логгера
 */
const globalLogger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  enableConsole: true,
  enableFile: process.env.LOG_TO_FILE === 'true'
});

/**
 * Глобальный экземпляр трекера производительности
 */
const globalPerformanceTracker = new PerformanceTracker();

module.exports = {
  Logger,
  PerformanceTracker,
  globalLogger,
  globalPerformanceTracker
};
