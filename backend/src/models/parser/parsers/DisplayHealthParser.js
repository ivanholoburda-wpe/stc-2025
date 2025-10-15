const BaseParser = require('../core/BaseParser');

class DisplayHealthParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_health_block';

    this.rules = [
      {
        // Основное правило для разбора каждой строки с данными
        name: 'health_data_row',
        // Эта регулярка захватывает все поля, включая значения памяти в MB
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
        // Правило для игнорирования заголовков и разделителей
        name: 'ignore_lines',
        regex: /^(?:Slot|---)/,
        handler: () => {
          // Ничего не делаем
        }
      }
    ];
  }

  /**
   * Точка входа: ищет уникальную комбинацию заголовков.
   */
  isEntryPoint(line) {
    return line.includes('CPU Usage') && line.includes('Memory Usage(Used/Total)');
  }

  /**
   * Инициализация структуры данных
   */
  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      components: [], // Массив для хранения данных о компонентах
    };
  }
}

module.exports = DisplayHealthParser;