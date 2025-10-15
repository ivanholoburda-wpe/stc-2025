const { globalLogger, globalPerformanceTracker } = require('./Logger');

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

  isEntryPoint(line) {
    throw new Error('isEntryPoint method must be implemented by subclass');
  }

  startBlock(line, match) {
    this.isActive = true;
    
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

  parseLine(line) {
    if (!this.isActive || !this.data) {
      return false;
    }

    this.stats.linesProcessed++;
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return true;
    }

    try {
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

      if (this._isGarbageData(trimmedLine)) {
        this._addWarning(`Skipped garbage data: ${trimmedLine}`, trimmedLine);
        return true;
      }

      this._addWarning(`Unrecognized line format: ${trimmedLine}`, trimmedLine);
      return true;

    } catch (error) {
      this._addError(`Unexpected error parsing line: ${error.message}`, trimmedLine);
      return true;
    }
  }

  isBlockComplete(line) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) return true;
    if (trimmedLine.startsWith('<')) return true;
    if (this.isEntryPoint(trimmedLine)) return true;
    
    return false;
  }

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

    this.data.stats = { 
      ...this.stats,
      processingTime: performanceMetric ? performanceMetric.duration : 0
    };
    this.data.errors = [...this.errors];
    this.data.warnings = [...this.warnings];

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

  _isGarbageData(line) {
    const garbagePatterns = [
      /^\s*$/,
      /^Error:/,
      /^\^/,
      /^Unrecognized command/,
      /^Wrong parameter/,
      /^Current system time:/,
      /^IP Sending Frames/,
    ];

    return garbagePatterns.some(pattern => pattern.test(line));
  }

  _addError(message, line = '') {
    const error = {
      message,
      line: line.substring(0, 100),
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

  _validateData() {
    if (!this.data) return;

    if (!this.data.type) {
      this._addError('Missing data type');
    }

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

  addValidationRule(rule) {
    this.validationRules.push(rule);
  }

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
