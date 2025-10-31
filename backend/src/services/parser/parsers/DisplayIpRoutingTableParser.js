const BaseParser = require('../core/BaseParser');


class DisplayIpRoutingTableStatisticsParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_ip_routing_table_statistics_block';
        this.priority = 9;

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


                    if (entry.protocol.toLowerCase() === 'total') {
                        this.data.totals = entry;
                    } else {
                        this.data.protocols.push(entry);
                    }
                }
            },
            {
                name: 'header_skip',

                regex: /^(Proto\s+total|routes\s+routes)/i,
                handler: () => {

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


}

module.exports = DisplayIpRoutingTableStatisticsParser;