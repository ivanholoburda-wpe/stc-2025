const BaseParser = require('../core/BaseParser');

class DisplayTransceiverVerboseParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_transceiver_verbose_block';
    this.currentSection = null;
  }

  isEntryPoint(line) {
    const regex = /^(?<interface>\S+)\s+transceiver information:\s*$/;
    return line.match(regex);
  }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      interface: match.groups.interface,
      common_information: {},
      manufacture_information: {},
      alarm_information: [],
      diagnostic_information: {},
    };
    this.currentSection = null;
  }

  parseLine(line) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('---')) {
      return true;
    }

    if (trimmedLine.endsWith(':')) {
      this._updateSection(trimmedLine);
      return true;
    }
    
    switch (this.currentSection) {
      case 'alarm_information':
        this.data.alarm_information.push(trimmedLine);
        break;
      case 'common_information':
      case 'manufacture_information':
      case 'diagnostic_information':
        this._parseKeyValue(trimmedLine);
        break;
      default:
        break;
    }
    return true;
  }

  _updateSection(line) {
    const sectionName = line.toLowerCase().replace(':', '').trim();
    switch (sectionName) {
      case 'common information': this.currentSection = 'common_information'; break;
      case 'manufacture information': this.currentSection = 'manufacture_information'; break;
      case 'alarm information': this.currentSection = 'alarm_information'; break;
      case 'diagnostic information': this.currentSection = 'diagnostic_information'; break;
    }
  }
  
  _parseKeyValue(line) {
    const kvRegex = /^(?<key>.+?)\s*:\s*(?<value>.*)$/;
    const match = line.match(kvRegex);
    
    if (match) {
      const key = match.groups.key.trim();
      const value = match.groups.value.trim();
      const normalizedKey = this._normalizeKey(key);
      const parsedValue = this._parseValue(value);

      if (this.data[this.currentSection]) {
        this.data[this.currentSection][normalizedKey] = parsedValue;
      }
    }
  }

  _normalizeKey(key) {
    return key.toLowerCase().replace(/\(.*\)/g, '').replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '_');
  }

  _parseValue(value) {
    if (value === '') return null;
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) ? num : value;
  }
}

module.exports = DisplayTransceiverVerboseParser;