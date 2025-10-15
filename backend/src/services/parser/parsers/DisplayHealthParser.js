const BaseParser = require('../core/BaseParser');

class DisplayHealthParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_health_block';

    this.rules = [
      {
        name: 'health_data_row',
        regex: /^\s*(?<slot>\d+)\s+(?<component>\S+)\s+(?<cpu_usage>\d+)%\s+(?<mem_percent>\d+)%\s+(?<mem_used>\d+)MB\/(?<mem_total>\d+)MB\s*$/,
        handler: (match) => {
          this.data.components.push({
            slot: parseInt(match.groups.slot, 10),
            component: match.groups.component,
            cpu_usage_percent: parseInt(match.groups.cpu_usage, 10),
            memory_usage_percent: parseInt(match.groups.mem_percent, 10),
            memory_used_mb: parseInt(match.groups.mem_used, 10),
            memory_total_mb: parseInt(match.groups.mem_total, 10),
          });
        }
      },
      {
        name: 'ignore_lines',
        regex: /^(?:Slot|---)/,
        handler: () => {
        }
      }
    ];
  }

  isEntryPoint(line) {
    return line.includes('CPU Usage') && line.includes('Memory Usage(Used/Total)');
  }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      components: [],
    };
  }
}

module.exports = DisplayHealthParser;