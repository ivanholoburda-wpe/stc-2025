const BaseParser = require('../core/BaseParser');

/**
 * Парсер для вывода команды 'display ip routing-table statistics'.
 * Собирает сводную информацию и статистику по каждому протоколу.
 */
class DisplayIpRoutingTableStatisticsParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_ip_routing_table_statistics_block';
        this.priority = 9; // Чуть выше, чем у 'display_ip_routing_table_block'

        this.rules = [
            {
                name: 'summary_prefixes',
                regex: /^Summary Prefixes\s*:\s*(?<count>\d+)/i,
                handler: (match) => {
                    this.data.summary_prefixes = parseInt(match.groups.count, 10);
                }
            },
            {
                name: 'protocol_stats',
                // Захватывает строки типа: DIRECT 20 20 35 15 15
                // или Total 299 295 3077 2778 2778
                regex: /^(?<proto>\S+)\s+(?<total>\d+)\s+(?<active>\d+)\s+(?<added>\d+)\s+(?<deleted>\d+)\s+(?<freed>\d+)\s*$/,
                handler: (match) => {
                    const entry = {
                        protocol: match.groups.proto,
                        total_routes: parseInt(match.groups.total, 10),
                        active_routes: parseInt(match.groups.active, 10),
                        added_routes: parseInt(match.groups.added, 10),
                        deleted_routes: parseInt(match.groups.deleted, 10),
                        freed_routes: parseInt(match.groups.freed, 10)
                    };

                    // Строку 'Total' сохраняем отдельно
                    if (entry.protocol.toLowerCase() === 'total') {
                        this.data.totals = entry;
                    } else {
                        this.data.protocols.push(entry);
                    }
                }
            },
            {
                name: 'header_skip',
                // Пропускаем строки заголовков
                regex: /^(Proto\s+total|routes\s+routes)/i,
                handler: () => {
                    // Ничего не делаем, просто пропускаем
                }
            }
        ];
    }

    isEntryPoint(line) {
        return line.includes('display ip routing-table statistics');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data,
            summary_prefixes: null,
            protocols: [],
            totals: null
        };
    }

    // Используем BaseParser.parseLine, так как мы определили this.rules
}

module.exports = DisplayIpRoutingTableStatisticsParser;