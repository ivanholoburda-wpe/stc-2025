class DataValidator {
  constructor() {
    this.rules = new Map();
    this.filters = new Map();
    this.transformers = new Map();
  }

  addRule(name, validator, message = 'Validation failed') {
    this.rules.set(name, { validator, message });
  }

  addFilter(name, filter) {
    this.filters.set(name, filter);
  }

  addTransformer(name, transformer) {
    this.transformers.set(name, transformer);
  }

  validate(data, ruleNames = null) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const rulesToApply = ruleNames ? 
      ruleNames.filter(name => this.rules.has(name)) : 
      Array.from(this.rules.keys());

    for (const ruleName of rulesToApply) {
      const rule = this.rules.get(ruleName);
      try {
        if (!rule.validator(data)) {
          result.isValid = false;
          result.errors.push({
            rule: ruleName,
            message: rule.message,
            data: this._sanitizeData(data)
          });
        }
      } catch (error) {
        result.isValid = false;
        result.errors.push({
          rule: ruleName,
          message: `Validation error: ${error.message}`,
          data: this._sanitizeData(data)
        });
      }
    }

    return result;
  }

  filter(data, filterNames = null) {
    let filteredData = { ...data };
    
    const filtersToApply = filterNames ? 
      filterNames.filter(name => this.filters.has(name)) : 
      Array.from(this.filters.keys());

    for (const filterName of filtersToApply) {
      const filter = this.filters.get(filterName);
      try {
        filteredData = filter(filteredData);
      } catch (error) {
        console.warn(`Filter "${filterName}" failed: ${error.message}`);
      }
    }

    return filteredData;
  }

  transform(data, transformerNames = null) {
    let transformedData = { ...data };
    
    const transformersToApply = transformerNames ? 
      transformerNames.filter(name => this.transformers.has(name)) : 
      Array.from(this.transformers.keys());

    for (const transformerName of transformersToApply) {
      const transformer = this.transformers.get(transformerName);
      try {
        transformedData = transformer(transformedData);
      } catch (error) {
        console.warn(`Transformer "${transformerName}" failed: ${error.message}`);
      }
    }

    return transformedData;
  }

  _sanitizeData(data) {
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'secret', 'key', 'token', 'auth'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    const jsonString = JSON.stringify(sanitized);
    if (jsonString.length > 1000) {
      return { ...sanitized, _truncated: true, _originalSize: jsonString.length };
    }

    return sanitized;
  }

  getStats() {
    return {
      rulesCount: this.rules.size,
      filtersCount: this.filters.size,
      transformersCount: this.transformers.size,
      rules: Array.from(this.rules.keys()),
      filters: Array.from(this.filters.keys()),
      transformers: Array.from(this.transformers.keys())
    };
  }
}

class CommonValidationRules {
  static createValidator() {
    const validator = new DataValidator();
    validator.addRule('required_type', (data) => data.type && typeof data.type === 'string', 'Type field is required');

    validator.addRule('required_timestamp', (data) => data.parsed_at && !isNaN(Date.parse(data.parsed_at)), 'Valid timestamp is required');

    validator.addRule('interface_name_format', (data) => {
      if (!data.interface) return true;
      return /^(GigabitEthernet|LoopBack|NULL|Vlanif)\S*$/.test(data.interface);
    }, 'Interface name must follow standard format');

    validator.addRule('mac_address_format', (data) => {
      if (!data.mac_address) return true;
      return /^[\da-f]{4}-[\da-f]{4}-[\da-f]{4}$/i.test(data.mac_address);
    }, 'MAC address must be in format XXXX-XXXX-XXXX');

    validator.addRule('port_settings_range', (data) => {
      if (!data.port_settings) return true;
      const { pvid, mtu } = data.port_settings;
      return (!pvid || (pvid >= 1 && pvid <= 4094)) && 
             (!mtu || (mtu >= 64 && mtu <= 9216));
    }, 'Port settings must be within valid ranges');

    validator.addRule('statistics_format', (data) => {
      if (!data.statistics) return true;
      const stats = data.statistics;
      return (!stats.rate || typeof stats.rate === 'object') &&
             (!stats.total || typeof stats.total === 'object');
    }, 'Statistics must have proper structure');

    return validator;
  }
}

class CommonFilters {
  static createFilters() {
    const validator = new DataValidator();

    validator.addFilter('remove_null_values', (data) => {
      const filtered = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            const filteredValue = validator.filter(value, ['remove_null_values']);
            if (Object.keys(filteredValue).length > 0) {
              filtered[key] = filteredValue;
            }
          } else {
            filtered[key] = value;
          }
        }
      }
      return filtered;
    });

    validator.addFilter('remove_empty_arrays', (data) => {
      const filtered = {};
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length === 0) {
          continue;
        }
        filtered[key] = value;
      }
      return filtered;
    });

    validator.addFilter('remove_technical_fields', (data) => {
      const technicalFields = ['raw_line', '_truncated', '_originalSize'];
      const filtered = {};
      for (const [key, value] of Object.entries(data)) {
        if (!technicalFields.includes(key)) {
          filtered[key] = value;
        }
      }
      return filtered;
    });

    return validator;
  }
}

class CommonTransformers {
  static createTransformers() {
    const validator = new DataValidator();

    validator.addTransformer('normalize_status', (data) => {
      const normalized = { ...data };
      
      if (normalized.state) {
        normalized.state = normalized.state.toUpperCase().trim();
      }
      
      if (normalized.protocol_status) {
        normalized.protocol_status = normalized.protocol_status.toUpperCase().trim();
      }

      return normalized;
    });

    validator.addTransformer('convert_numbers', (data) => {
      const converted = { ...data };
      
      if (converted.statistics) {
        if (converted.statistics.rate) {
          ['input', 'output'].forEach(direction => {
            if (converted.statistics.rate[direction]) {
              const rate = converted.statistics.rate[direction];
              if (rate.bytes_per_sec) rate.bytes_per_sec = parseInt(rate.bytes_per_sec, 10);
              if (rate.packets_per_sec) rate.packets_per_sec = parseInt(rate.packets_per_sec, 10);
            }
          });
        }
        
        if (converted.statistics.total) {
          ['input', 'output'].forEach(direction => {
            if (converted.statistics.total[direction]) {
              const total = converted.statistics.total[direction];
              if (total.bytes) total.bytes = parseInt(total.bytes, 10);
              if (total.packets) total.packets = parseInt(total.packets, 10);
            }
          });
        }
      }

      return converted;
    });

    validator.addTransformer('add_metadata', (data) => {
      return {
        ...data,
        metadata: {
          processed_at: new Date().toISOString(),
          version: '1.0',
          parser_version: data.type || 'unknown'
        }
      };
    });

    return validator;
  }
}

module.exports = {
  DataValidator,
  CommonValidationRules,
  CommonFilters,
  CommonTransformers
};
