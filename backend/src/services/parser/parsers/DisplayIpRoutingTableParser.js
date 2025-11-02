const BaseParser = require('../core/BaseParser');

class DisplayIpRoutingTableParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_ip_routing_table_block';
        this.priority = 10;

        this.lastRoute = null;

        this.rules = [
            {
                name: 'data_row',
                regex: /^\s*(?<Dest>\S+\/\d{1,2})\s+(?<Proto>\S+)\s+(?<Pre>\d+)\s+(?<Cost>\d+)\s+(?<Flags>\S+)\s+(?<NextHop>\S+)\s+(?<Interface>\S+)\s*$/,
                handler: (match) => {
                    const newRoute = {
                        destination_mask: match.groups.Dest,
                        protocol: match.groups.Proto,
                        preference: parseInt(match.groups.Pre, 10),
                        cost: parseInt(match.groups.Cost, 10),
                        flags: match.groups.Flags,
                        next_hop: match.groups.NextHop,
                        interface: match.groups.Interface,
                        secondary_paths: []
                    };

                    this.data.routes.push(newRoute);
                    this.lastRoute = newRoute;
                }
            },
            {
                name: 'secondary_data_row',
                regex: /^\s*(?<Proto>\S+)\s+(?<Pre>\d+)\s+(?<Cost>\d+)\s+(?<Flags>\S+)\s+(?<NextHop>\S+)\s+(?<Interface>\S+)\s*$/,
                handler: (match) => {
                    if (!this.lastRoute) {
                        this._addWarning("Found a secondary route path without a primary route", match.input);
                        return;
                    }
                    if (!this.lastRoute.secondary_paths) {
                        this.lastRoute.secondary_paths = [];
                    }
                    this.lastRoute.secondary_paths.push({
                        protocol: match.groups.Proto,
                        preference: parseInt(match.groups.Pre, 10),
                        cost: parseInt(match.groups.Cost, 10),
                        flags: match.groups.Flags,
                        next_hop: match.groups.NextHop,
                        interface: match.groups.Interface,
                    });
                }
            },
            {
                name: 'table_header',
                regex: /^\s*Destination\/Mask\s+Proto\s+Pre\s+Cost\s+Flags\s+NextHop\s+Interface/,
                handler: () => {}
            },
            {
                name: 'table_name',
                regex: /^\s*Routing Table\s*:\s*(?<name>\S+)/,
                handler: (match) => {
                    this.data.table = match.groups.name;
                }
            },
            {
                name: 'table_stats',
                regex: /^\s*Destinations\s*:\s*(?<dest_count>\d+)\s+Routes\s*:\s*(?<route_count>\d+)/,
                handler: (match) => {
                    this.data.destinations = parseInt(match.groups.dest_count, 10);
                    this.data.routes_count = parseInt(match.groups.route_count, 10);
                }
            }
        ];
    }

    isEntryPoint(line) {
        if (line.includes('display ip routing-table statistics')) {
            return false;
        }

        return line.includes('display ip routing-table');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data,
            table: null,
            destinations: 0,
            routes_count: 0,
            routes: [],
        };
        this.lastRoute = null;
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('Route Flags:') || trimmedLine.startsWith('Proto:')) {
            return true;
        }

        if (trimmedLine.startsWith('---')) {
            return true;
        }

        if (!trimmedLine) {
            return true;
        }

        return super.parseLine(line);
    }


    isBlockComplete(line) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            return false;
        }

        if (super.isBlockComplete(line)) {
            return true;
        }

        if (trimmedLine.startsWith('=========') || (line.includes('display ') && !line.includes('display ip routing-table'))) {
            if (trimmedLine !== this.data.raw_line.trim()) {
                return true;
            }
        }

        if (line.includes('display ip routing-table') && trimmedLine !== this.data.raw_line.trim()) {
            return true;
        }

        return false;
    }

    _validateData() {
        super._validateData();

        if (!this.data || !this.data.routes) return;

        if (this.data.routes.length === 0 && this.data.routes_count > 0) {
            this._addWarning('Parsed routes count does not match header count. Routes array is empty.');
            return;
        }

        let parsedRouteCount = 0;
        this.data.routes.forEach(r => {
            parsedRouteCount++;
            if(r.secondary_paths) {
                parsedRouteCount += r.secondary_paths.length;
            }
        });

        if (parsedRouteCount !== this.data.routes_count && this.data.routes_count > 0) {
            this._addWarning(`Parsed routes count (${parsedRouteCount}) does not match header count (${this.data.routes_count})`);
        }
    }
}

module.exports = DisplayIpRoutingTableParser;