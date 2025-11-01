const BaseParser = require('../core/BaseParser');


const REGEX_PRIMARY_ROUTE = /^(?<status>\S+)\s+(?<network>\S+)\s+(?<nexthop>\S+)\s+(?<med>\S*)\s+(?<locprf>\S*)\s+(?<prefval>\S+)\s+(?<path>.*)$/;


const REGEX_SECONDARY_ROUTE = /^(?<status>\S+)\s{2,}(?<nexthop>\S+)\s+(?<med>\S*)\s+(?<locprf>\S*)\s+(?<prefval>\S+)\s+(?<path>.*)$/;


class DisplayBgpVpnv4RoutingTableParser extends BaseParser {

    constructor() {
        super();
        this.name = 'display_bgp_vpnv4_routing_table_block';
        this.currentRD = null;
        this.lastPrimaryRoute = null;
    }

    isEntryPoint(line) {
        return line.includes('display bgp vpnv4 all routing-table');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data,
            global_info: {},
            route_distinguishers: []
        };
        this.currentRD = null;
        this.lastPrimaryRoute = null;
    }

    isBlockComplete(line) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            return false;
        }
        return super.isBlockComplete(line);
    }

    parseLine(line) {
        const trimmedLine = line.trim();


        if (!trimmedLine ||
            trimmedLine.startsWith('Status codes:') ||
            trimmedLine.startsWith('RPKI validation codes:') ||
            trimmedLine.startsWith('Network      ')) {
            return true;
        }


        let routerIdMatch = trimmedLine.match(/^BGP Local router ID is (?<router_id>\S+)/i);
        if (routerIdMatch) {
            this.data.global_info.local_router_id = routerIdMatch.groups.router_id;
            return true;
        }

        let totalRoutesMatch = trimmedLine.match(/^Total number of routes from all PE: (?<total>\d+)/i);
        if (totalRoutesMatch) {
            this.data.global_info.total_routes_all_pe = parseInt(totalRoutesMatch.groups.total, 10);
            return true;
        }


        let rdMatch = trimmedLine.match(/^Route Distinguisher: (?<rd>\S+)/i);
        if (rdMatch) {
            this.currentRD = {
                rd: rdMatch.groups.rd,
                routes: []
            };
            this.data.route_distinguishers.push(this.currentRD);
            this.lastPrimaryRoute = null;
            return true;
        }


        if (!this.currentRD) {
            return true;
        }


        let secondaryMatch = trimmedLine.match(REGEX_SECONDARY_ROUTE);
        if (secondaryMatch) {
            const path = this._createRouteObject(secondaryMatch.groups);

            if (this.lastPrimaryRoute) {
                if (!this.lastPrimaryRoute.secondary_paths) {
                    this.lastPrimaryRoute.secondary_paths = [];
                }
                this.lastPrimaryRoute.secondary_paths.push(path);
            } else {
                this.currentRD.routes.push(path);
            }
            return true;
        }


        let primaryMatch = trimmedLine.match(REGEX_PRIMARY_ROUTE);
        if (primaryMatch) {
            const route = this._createRouteObject(primaryMatch.groups);
            this.currentRD.routes.push(route);
            this.lastPrimaryRoute = route;
            return true;
        }


        return super.parseLine(line);
    }


    _createRouteObject(groups) {
        return {
            status: groups.status,
            network: this._parseValue(groups.network),
            next_hop: groups.nexthop,
            med: this._parseValue(groups.med),
            loc_prf: this._parseValue(groups.locprf),
            pref_val: this._parseValue(groups.prefval),
            path_ogn: this._parseValue(groups.path)
        };
    }

    _parseValue(value) {
        if (value === undefined || value === null) {
            return null;
        }

        const trimmed = value.trim();

        if (trimmed === '') {
            return null;
        }

        if (trimmed.includes(' ') || trimmed.includes('?') || trimmed.includes('i') || trimmed.includes('e') || trimmed.includes('*')) {
            return trimmed;
        }

        const num = parseInt(trimmed, 10);
        return !isNaN(num) && String(num) === trimmed ? num : trimmed;
    }
}


module.exports = DisplayBgpVpnv4RoutingTableParser;