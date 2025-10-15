const BaseParser = require('../core/BaseParser');

class DisplayInterfaceBriefParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_interface_brief_block';
    this.priority = 1;

    this.rules = [
      {
        name: 'data_row',
        regex: /^(?<Interface>\S+)\s+(?<PHY>\S+)\s+(?<Protocol>\S+)\s+(?<InUti>\S+)\s+(?<OutUti>\S+)\s+(?<inErrors>\d+)\s+(?<outErrors>\d+)\s*$/,
        handler: (match) => {
          this.data.interfaces.push({
            interface: match.groups.Interface,
            phy_status: match.groups.PHY,
            protocol_status: match.groups.Protocol,
            in_utilization: match.groups.InUti,
            out_utilization: match.groups.OutUti,
            in_errors: parseInt(match.groups.inErrors, 10),
            out_errors: parseInt(match.groups.outErrors, 10),
          });
        }
      },
      {
        name: 'table_header',
        regex: /^\s*Interface\s+PHY\s+Protocol/,
        handler: () => {
          // Заголовок таблицы - просто пропускаем
        }
      },
      {
        name: 'separator_line',
        regex: /^[-=\s]+$/,
        handler: () => {
          // Разделительные линии - пропускаем
        }
      }
    ];

    // Добавляем правила валидации
    this.addValidationRule({
      name: 'interfaces_array_required',
      validate: (data) => Array.isArray(data.interfaces) && data.interfaces.length > 0,
      message: 'At least one interface must be parsed'
    });

    this.addValidationRule({
      name: 'interface_data_valid',
      validate: (data) => {
        return data.interfaces.every(iface => 
          iface.interface && 
          iface.phy_status && 
          iface.protocol_status &&
          typeof iface.in_errors === 'number' &&
          typeof iface.out_errors === 'number'
        );
      },
      message: 'All interfaces must have valid data'
    });
  }

  isEntryPoint(line) {
    const regex = /^\s*Interface\s+PHY\s+Protocol/;
    return line.match(regex);
  }

  startBlock(line, match) { 
    super.startBlock(line, match);
    
    // Расширяем базовую структуру данных
    this.data = {
      ...this.data,
      interfaces: [],
    };
  }

  parseLine(line) {
    const trimmedLine = line.trim();
    
    // Пропускаем пустые строки
    if (!trimmedLine) {
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
    
    // Дополнительные условия для brief таблицы
    if (trimmedLine.startsWith('Interface') && trimmedLine !== this.data.raw_line) {
      return true;
    }
    
    return false;
  }

  /**
   * Переопределяем метод валидации для специфичных проверок brief таблицы
   */
  _validateData() {
    super._validateData();
    
    if (!this.data || !this.data.interfaces) return;

    // Проверяем каждую строку интерфейса
    this.data.interfaces.forEach((iface, index) => {
      // Проверяем статусы PHY
      if (!['Up', 'Down', 'Administratively Down'].includes(iface.phy_status)) {
        this._addWarning(`Invalid PHY status for interface ${iface.interface}: ${iface.phy_status}`);
      }

      // Проверяем статусы протокола
      if (!['Up', 'Down'].includes(iface.protocol_status)) {
        this._addWarning(`Invalid protocol status for interface ${iface.interface}: ${iface.protocol_status}`);
      }

      // Проверяем ошибки
      if (iface.in_errors < 0 || iface.out_errors < 0) {
        this._addWarning(`Negative error count for interface ${iface.interface}`);
      }

      // Проверяем утилизацию
      if (iface.in_utilization && !/^\d+(\.\d+)?%?$/.test(iface.in_utilization)) {
        this._addWarning(`Invalid input utilization format for interface ${iface.interface}: ${iface.in_utilization}`);
      }

      if (iface.out_utilization && !/^\d+(\.\d+)?%?$/.test(iface.out_utilization)) {
        this._addWarning(`Invalid output utilization format for interface ${iface.interface}: ${iface.out_utilization}`);
      }
    });
  }
}

module.exports = DisplayInterfaceBriefParser;