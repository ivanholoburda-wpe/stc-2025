class DisplayInterfaceParser {
  name = 'display_interface_block';
  priority = 100;
  data = null;
  sub_parser_mode = null;

  constructor() {
    this.rules = [
      {
        name: 'status_lines',
        regex: /current state\s+:\s+(?<state>.+?)\s*$/,
        handler: (match) => { this.data.state = match.groups.state; }
      },
      {
        name: 'protocol_status_line',
        regex: /Line protocol current state\s+:\s+(?<protocol>.+?)\s*$/,
        handler: (match) => { this.data.protocol_status = match.groups.protocol; }
      },
      {
        name: 'description_line',
        regex: /^Description:\s*(?<desc>.*)$/,
        handler: (match) => { this.data.description = match.groups.desc || null; }
      },
      {
        name: 'switch_port_settings',
        regex: /Switch Port, PVID\s+:\s+(?<pvid>\d+), TPID\s+:\s+(?<tpid>\S+), The Maximum Frame Length is (?<mtu>\d+)/,
        handler: (match) => {
          this.data.port_settings.pvid = parseInt(match.groups.pvid, 10);
          this.data.port_settings.tpid = match.groups.tpid;
          this.data.port_settings.mtu = parseInt(match.groups.mtu, 10);
        }
      },
      {
        name: 'hardware_address',
        regex: /Hardware address is (?<mac>[\da-f]{4}-[\da-f]{4}-[\da-f]{4})/,
        handler: (match) => { this.data.mac_address = match.groups.mac; }
      },
      {
        name: 'last_up_down_time',
        regex: /Last physical (up|down) time\s+:\s+(?<timestamp>.+?)\s*$/,
        handler: (match) => {
          const type = match[1];
          this.data[`last_${type}_time`] = match.groups.timestamp;
        }
      },
      {
        name: 'rate_stats',
        regex: /Last 300 seconds (input|output) rate (?<bytes>\d+) bytes\/sec, (?<packets>\d+) packets\/sec/,
        handler: (match) => {
          const type = match[1];
          this.data.statistics.rate[type] = {
            bytes_per_sec: parseInt(match.groups.bytes, 10),
            packets_per_sec: parseInt(match.groups.packets, 10),
          };
        }
      },
      {
        name: 'total_stats',
        regex: /^(Input|Output):\s+(?<bytes>\d+) bytes, (?<packets>\d+) packets/,
        handler: (match) => {
          const type = match[1].toLowerCase();
          this.data.statistics.total[type] = {
            bytes: parseInt(match.groups.bytes, 10),
            packets: parseInt(match.groups.packets, 10),
          };
        }
      },
      {
        name: 'bandwidth_utilization',
        regex: /^(Input|Output) bandwidth utilization\s+:\s+(?<utilization>.+?)\s*$/,
        handler: (match) => {
          const type = match[1].toLowerCase();
          this.data.statistics.utilization[type] = match.groups.utilization;
        }
      },
      {
        name: 'input_block_start',
        regex: /^Input:$/,
        handler: () => { this.sub_parser_mode = 'input'; }
      },
      {
        name: 'output_block_start',
        regex: /^Output:$/,
        handler: () => { this.sub_parser_mode = 'output'; }
      },
      {
        name: 'packet_types',
        regex: /^(Unicast|Multicast|Broadcast):\s+(?<packets>\d+) packets/,
        handler: (match) => {
          if (this.sub_parser_mode) {
            const type = match[1].toLowerCase();
            this.data.statistics.packet_types[this.sub_parser_mode][type] = parseInt(match.groups.packets, 10);
          }
        }
      }
    ];
  }

  isEntryPoint(line) {
    const trimmedLine = line.trim();
    const regex = /^(?<iface>(GigabitEthernet|LoopBack|NULL|Vlanif)\S*)(\s+current state\s+:\s+(?<state>.+?)\s*$|\s*$)/;
    return trimmedLine.match(regex);
  }

  startBlock(line, match) {
    this.sub_parser_mode = null;
    this.data = {
      type: this.name,
      interface: match.groups.iface,
      state: match.groups.state || null,
      protocol_status: null,
      description: null,
      mac_address: null,
      last_up_time: null,
      last_down_time: null,
      port_settings: { pvid: null, tpid: null, mtu: null },
      statistics: {
        rate: { input: {}, output: {} },
        total: { input: {}, output: {} },
        utilization: { input: null, output: null },
        packet_types: {
          input: { unicast: null, multicast: null, broadcast: null },
          output: { unicast: null, multicast: null, broadcast: null },
        }
      }
    };
  }

  parseLine(line) {
    const trimmedLine = line.trim();
    if (this.data.state && trimmedLine.includes('current state')) {
      return;
    }

    for (const rule of this.rules) {
      const match = trimmedLine.match(rule.regex);
      if (match) {
        rule.handler(match);
        return;
      }
    }
  }

  isBlockComplete(line) {
    const trimmedLine = line.trim();
    return trimmedLine === '' || trimmedLine.startsWith('<') || this.isEntryPoint(trimmedLine);
  }
  
  getResult() {
    return this.data;
  }
}

module.exports = new DisplayInterfaceParser();