const BaseParser = require('../core/BaseParser');

class DisplayIpRoutingTableParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_ip_routing_table_block';
    
    // Храним ссылку на текущую таблицу маршрутизации, которую парсим
    this.currentRoutingTable = null;

    this.rules = [
      {
        // Правило находит заголовок новой таблицы (например, Routing Table : _public_)
        name: 'routing_table_header',
        regex: /^Routing Table\s*:\s*(?<name>\S+)/,
        handler: (match) => {
          const newTable = { name: match.groups.name, summary: {}, routes: [] };
          this.data.tables.push(newTable);
          // Устанавливаем эту таблицу как текущую для обработки
          this.currentRoutingTable = newTable;
        }
      },
      {
        // Правило для сводной информации о количестве маршрутов
        name: 'summary_info',
        regex: /Destinations\s*:\s*(?<dest_count>\d+)\s+Routes\s*:\s*(?<route_count>\d+)/,
        handler: (match) => {
          if (this.currentRoutingTable) {
            this.currentRoutingTable.summary = {
              destinations: parseInt(match.groups.dest_count, 10),
              routes: parseInt(match.groups.route_count, 10),
            };
          }
        }
      },
      {
        // Основное правило для разбора каждого маршрута в таблице
        // 🔥 Оно очень гибкое: захватывает обязательные поля и "остаток" строки
        name: 'route_entry',
        regex: /^\s*(?<Destination_Mask>\S+)\s+(?<Proto>\S+)\s+(?<Pre>\d+)\s+(?<Cost>\d+)\s+(?<TheRest>.*)$/,
        handler: (match) => {
          if (!this.currentRoutingTable) return;

          // "Остаток" строки разбирается программно, а не одной сложной регуляркой
          const rest = match.groups.TheRest.trim().split(/\s+/);
          
          const interfaceName = rest.pop(); // Последний элемент - всегда Interface
          const next_hop = rest.pop();      // Предпоследний - всегда NextHop
          const flags = rest.join(' ') || null; // Всё, что осталось (если осталось) - это Flags

          this.currentRoutingTable.routes.push({
            destination_mask: match.groups.Destination_Mask,
            protocol: match.groups.Proto,
            preference: parseInt(match.groups.Pre, 10),
            cost: parseInt(match.groups.Cost, 10),
            flags: flags,
            next_hop: next_hop,
            interface: interfaceName,
          });
        }
      },
      {
        // Правило для игнорирования легенды и пустых строк
        name: 'ignore_lines',
        regex: /^(?:Proto:|Route Flags:|---)/,
        handler: () => { /* Ничего не делаем */ }
      }
    ];
  }

  /**
   * Точка входа: ищет заголовок таблицы. Это самый надежный маркер.
   */
  isEntryPoint(line) {
    // Этот метод не зависит от количества пробелов и гарантированно найдет заголовок.
    return line.includes('Destination/Mask') && line.includes('Proto') && line.includes('Pre');
  }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      tables: [], // Создаем массив для хранения всех таблиц маршрутизации
    };
    this.currentRoutingTable = null; // Сбрасываем состояние
  }
}

module.exports = DisplayIpRoutingTableParser;