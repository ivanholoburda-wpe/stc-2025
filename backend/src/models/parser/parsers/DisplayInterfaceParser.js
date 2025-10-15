const BaseParser = require('../core/BaseParser');

class DisplayInterfaceParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_interface_block';
    this.priority = 2;
    this.sub_parser_mode = null;

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

    // Добавляем правила валидации
    this.addValidationRule({
      name: 'interface_name_required',
      validate: (data) => data.interface && data.interface.length > 0,
      message: 'Interface name is required'
    });

    this.addValidationRule({
      name: 'state_required',
      validate: (data) => data.state && ['UP', 'DOWN', 'ADMINISTRATIVELY DOWN'].includes(data.state.toUpperCase()),
      message: 'Valid interface state is required'
    });
  }

  isEntryPoint(line) {
    const trimmedLine = line.trim();
    const regex = /^(?<iface>(GigabitEthernet|LoopBack|NULL|Vlanif)\S*)(\s+current state\s+:\s+(?<state>.+?)\s*$|\s*$)/;
    return trimmedLine.match(regex);
  }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.sub_parser_mode = null;
    
    // Расширяем базовую структуру данных
    this.data = {
      ...this.data,
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
    
    // Пропускаем дублирующиеся строки состояния
    if (this.data.state && trimmedLine.includes('current state')) {
      return true;
    }

    return super.parseLine(line);
  }

  isBlockComplete(line) {
    const trimmedLine = line.trim();
    
    // Расширяем базовые условия завершения
    if (super.isBlockComplete(line)) {
      return true;
    }
    
    // Дополнительные условия для интерфейсов
    if (trimmedLine.startsWith('GigabitEthernet') && trimmedLine !== this.data.interface) {
      return true;
    }
    
    return false;
  }

  /**
   * Переопределяем метод валидации для специфичных проверок интерфейса
   */
  _validateData() {
    super._validateData();
    
    if (!this.data) return;

    // Проверяем корректность MAC адреса
    if (this.data.mac_address && !/^[\da-f]{4}-[\da-f]{4}-[\da-f]{4}$/i.test(this.data.mac_address)) {
      this._addWarning('Invalid MAC address format', this.data.mac_address);
    }

    // Проверяем корректность PVID
    if (this.data.port_settings.pvid && (this.data.port_settings.pvid < 1 || this.data.port_settings.pvid > 4094)) {
      this._addWarning('PVID out of valid range (1-4094)', this.data.port_settings.pvid.toString());
    }

    // Проверяем корректность MTU
    if (this.data.port_settings.mtu && (this.data.port_settings.mtu < 64 || this.data.port_settings.mtu > 9216)) {
      this._addWarning('MTU out of valid range (64-9216)', this.data.port_settings.mtu.toString());
    }
  }
}

module.exports = DisplayInterfaceParser;