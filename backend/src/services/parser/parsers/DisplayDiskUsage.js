const BaseParser = require('../../../../../../Users/Professional/Desktop/stc-2025-parser/parser/core/BaseParser');


class DisplayDiskUsageParser extends BaseParser {
  constructor() {
    super();
    this.name = 'dir_storage_summary_block';
    this.priority = 80; 

    this.rules = [
      {
        name: 'dir_summary',
        regex: /^(?<total>[\d,]+)\s*KB\s+total\s*\(\s*(?<free>[\d,]+)\s*KB\s+free\s*\)\s*$/i,
        handler: (m) => {
          const totalKb = this._toInt(m.groups.total);
          const freeKb = this._toInt(m.groups.free);
          this.data.total_kb = totalKb;
          this.data.free_kb = freeKb;
          this.data.total_mb = totalKb != null ? totalKb / 1024 : null;
          this.data.free_mb = freeKb != null ? freeKb / 1024 : null;
        }
      }
    ];
  }

  isEntryPoint(line) {
    const t = line.trim();
    return /^(?:[\d,]+)\s*KB\s+total\s*\(\s*(?:[\d,]+)\s*KB\s+free\s*\)\s*$/i.test(t);
  }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      total_kb: null,
      free_kb: null,
      total_mb: null,
      free_mb: null
    };
    this.parseLine(line);
  }

  _toInt(val) {
    try {
      const s = String(val).replace(/,/g, '');
      const n = parseInt(s, 10);
      return isNaN(n) ? null : n;
    } catch (e) {
      return null;
    }
  }
}

module.exports = DisplayDiskUsageParser;
