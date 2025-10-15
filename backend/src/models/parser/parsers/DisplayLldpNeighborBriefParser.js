const BaseParser = require('../core/BaseParser');

class DisplayLldpNeighborBriefParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_lldp_neighbor_brief_block';

    this.rules = [
      {
        // Основное правило для разбора каждой строки с данными о соседе
        name: 'neighbor_row',
        // 🔥 Эта регулярка очень гибкая: она захватывает первый и последние два столбца,
        // а все, что между ними, считает именем устройства.
        regex: /^\s*(?<local_intf>\S+)\s+(?<neighbor_dev>.+?)\s+(?<neighbor_intf>\S+)\s+(?<exptime>\d+)\s*$/,
        handler: (match) => {
          this.data.neighbors.push({
            local_interface: match.groups.local_intf,
            neighbor_device: match.groups.neighbor_dev.trim(),
            neighbor_interface: match.groups.neighbor_intf,
            expire_time_s: parseInt(match.groups.exptime, 10),
          });
        }
      },
      {
        // Правило для игнорирования заголовков и разделителей
        name: 'ignore_lines',
        regex: /^(?:Local Intf|---)/,
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
    return line.includes('Local Intf') && line.includes('Neighbor Dev') && line.includes('Exptime');
  }

  /**
   * Инициализация структуры данных
   */
  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      neighbors: [], // Массив для хранения всех соседей
    };
  }
}

module.exports = DisplayLldpNeighborBriefParser;