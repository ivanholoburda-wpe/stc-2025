const BaseParser = require('../core/BaseParser');

class DisplayStpBriefParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_stp_brief_block';

    this.rules = [
      {
        name: 'key_value_pair',
        regex: /^\s*(?<key>.+?)\s*:\s*(?<value>.*)$/,
        handler: (match) => {
          const { key, value } = match.groups;
          const normalizedKey = this._normalizeKey(key);
          const parsedValue = this._parseValue(value);
          this.data[normalizedKey] = parsedValue;
        }
      }
    ];
  }

  isEntryPoint(line) {
    return line.trim().startsWith('Protocol Status');
  }

  /**
   * Инициализация структуры данных
   */
  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
    };
    
    // 🔥 ИСПРАВЛЕНИЕ ЗДЕСЬ:
    // Немедленно обрабатываем первую строку, которую мы использовали как точку входа.
    this.parseLine(line);
  }

  _normalizeKey(key) {
    return key
      .trim()
      .toLowerCase()
      .replace(/\(s\)/g, '')
      .replace(/\s+/g, '_');
  }

  _parseValue(value) {
    const trimmed = value.trim();
    const num = parseInt(trimmed, 10);
    return !isNaN(num) ? num : trimmed;
  }
}

module.exports = DisplayStpBriefParser;