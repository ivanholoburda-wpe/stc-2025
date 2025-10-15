class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile || false;
    this.filePath = options.filePath || 'parser.log';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024;
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

    this.stats.totalLogs++;
    if (!this.stats.logsByLevel[level]) {
      this.stats.logsByLevel[level] = 0;
    }
    this.stats.logsByLevel[level]++;

    if (level === 'error') {
      this.stats.errors.push(logEntry);
    } else if (level === 'warn') {
      this.stats.warnings.push(logEntry);
    }

    if (this.enableConsole) {
      this._logToConsole(logEntry);
    }

    if (this.enableFile) {
      this._logToFile(logEntry);
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  _logToConsole(logEntry) {
    const { timestamp, level, message, meta } = logEntry;
    const time = timestamp.split('T')[1].split('.')[0];
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    
    const colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[90m'
    };
    
    const reset = '\x1b[0m';
    const color = colors[level] || '';
    
    console.log(`${color}[${time}] ${level.toUpperCase()}: ${message}${metaStr}${reset}`);
  }

  async _logToFile(logEntry) {
    try {
      const fs = require('fs').promises;
      const logLine = JSON.stringify(logEntry) + '\n';
      
      await this._rotateLogFile();
      
      await fs.appendFile(this.filePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  async _rotateLogFile() {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const stats = await fs.stat(this.filePath).catch(() => null);
      if (!stats || stats.size < this.maxFileSize) {
        return;
      }

      for (let i = this.maxFiles - 1; i > 0; i--) {
        const oldFile = `${this.filePath}.${i}`;
        const newFile = `${this.filePath}.${i + 1}`;
        
        try {
          await fs.rename(oldFile, newFile);
        } catch (error) {
        }
      }

      await fs.rename(this.filePath, `${this.filePath}.1`);
    } catch (error) {
      console.error('Failed to rotate log file:', error.message);
    }
  }

  getStats() {
    return {
      ...this.stats,
      recentErrors: this.stats.errors.slice(-10),
      recentWarnings: this.stats.warnings.slice(-10)
    };
  }

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

class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
  }

  startTimer(name) {
    this.timers.set(name, {
      start: process.hrtime.bigint(),
      startMemory: process.memoryUsage()
    });
  }

  endTimer(name, meta = {}) {
    const timer = this.timers.get(name);
    if (!timer) {
      console.warn(`Timer "${name}" was not started`);
      return;
    }

    const end = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(end - timer.start) / 1000000;
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

  clearMetrics() {
    this.metrics.clear();
    this.timers.clear();
  }
}

const globalLogger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  enableConsole: true,
  enableFile: process.env.LOG_TO_FILE === 'true'
});

const globalPerformanceTracker = new PerformanceTracker();

module.exports = {
  Logger,
  PerformanceTracker,
  globalLogger,
  globalPerformanceTracker
};
