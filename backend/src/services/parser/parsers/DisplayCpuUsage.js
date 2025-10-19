const BaseParser = require('../../../../../../Users/Professional/Desktop/stc-2025-parser/parser/core/BaseParser');

class DisplayCpuUsage extends BaseParser {
  constructor() {
    super();
    this.name = 'display_cpu_usage_block';
    this.priority = 40;

    this._seenDetailsHeader = false;

    this.rules = [
      {
        name: 'entry_command_ignore',
        regex: /^display\s+cpu-usage$/i,
        handler: () => {}
      },
      {
        name: 'timestamp',
        
        regex: /^Cpu utilization statistics at\s+(?<ts>.+)$/i,
        handler: (m) => {
          this.data.timestamp = m.groups.ts.trim();
        }
      },
      {
        name: 'system_cpu_rate',
        
        regex: /^System cpu use rate is\s*:\s*(?<pct>\d+)%$/i,
        handler: (m) => {
          this.data.system_cpu_use_rate_percent = parseInt(m.groups.pct, 10);
        }
      },
      {
        name: 'averages',
        
        regex: /^Cpu utilization for five seconds:\s*(?<s5>\d+)%\s*;\s*one minute:\s*(?<m1>\d+)%\s*;\s*five minutes:\s*(?<m5>\d+)%\.?$/i,
        handler: (m) => {
          this.data.cpu_avg.five_seconds = parseInt(m.groups.s5, 10);
          this.data.cpu_avg.one_minute = parseInt(m.groups.m1, 10);
          this.data.cpu_avg.five_minutes = parseInt(m.groups.m5, 10);
        }
      },
      {
        name: 'max_usage',
        
        regex: /^Max CPU Usage\s*:\s*(?<pct>\d+)%$/i,
        handler: (m) => {
          this.data.max_cpu_usage_percent = parseInt(m.groups.pct, 10);
        }
      },
      {
        name: 'max_usage_time',
        
        regex: /^Max CPU Usage Stat\. Time\s*:\s*(?<ts>.+)$/i,
        handler: (m) => {
          this.data.max_cpu_usage_time = m.groups.ts.trim();
        }
      },
      {
        name: 'ignore_headers',
        regex: /^(?:[-]{2,}|ServiceName\s+UseRate|CPU Usage Details|CPU\s+Current\s+FiveSec\s+OneMin\s+FiveMin\s+Max\s+MaxTime)$/i,
        handler: (m, line) => {
          if (/^CPU Usage Details$/i.test(line)) {
            this._seenDetailsHeader = true;
          }
        }
      },
      {
        name: 'service_row',
        
        regex: /^(?!cpu\d+\b)(?<service>[A-Z][A-Z0-9\s]+?)\s+(?<pct>\d+)%$/,
        handler: (m) => {
          const name = m.groups.service.trim();
          
          if (/^(ServiceName|UseRate)$/i.test(name)) return;
          this.data.services.push({
            service_name: name,
            use_rate_percent: parseInt(m.groups.pct, 10)
          });
        }
      }
    ];
  }

    isEntryPoint(line) {
        const t = line.trim();
        return /^(display\s+cpu-usage)$/i.test(t);
    }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      timestamp: null,
      system_cpu_use_rate_percent: null,
      cpu_avg: { five_seconds: null, one_minute: null, five_minutes: null },
      max_cpu_usage_percent: null,
      max_cpu_usage_time: null,
      services: []
    };

    this.parseLine(line);
  }
}

module.exports = DisplayCpuUsage;