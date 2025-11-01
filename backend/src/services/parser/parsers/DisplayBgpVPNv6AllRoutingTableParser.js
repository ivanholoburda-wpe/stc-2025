const BaseParser = require('../core/BaseParser');


class DisplayBgpVpnv6RoutingTableParser extends BaseParser {

    constructor() {
        super();
        this.name = 'display_bgp_vpnv6_routing_table_block';
        this.currentRD = null;
        this.currentRoute = null;
    }

    isEntryPoint(line) {
        return line.includes('display bgp vpnv6 all routing-table');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data,
            global_info: {},
            route_distinguishers: []
        };
        this.currentRD = null;
        this.currentRoute = null;
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
            trimmedLine.startsWith('RPKI validation codes:')) {
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
            this.currentRoute = null;
            return true;
        }


        if (!this.currentRD) {
            return true;
        }


        let routeStartMatch = trimmedLine.match(/^(?<status>\S+)\s+Network\s*:\s*(?<network>\S+)\s+PrefixLen\s*:\s*(?<prefix_len>\d+)/);
        if (routeStartMatch) {
            this.currentRoute = {
                status: routeStartMatch.groups.status,
                network: routeStartMatch.groups.network,
                prefix_len: parseInt(routeStartMatch.groups.prefix_len, 10),
            };
            this.currentRD.routes.push(this.currentRoute);
            return true;
        }


        if (!this.currentRoute) {

            return true;
        }


        let nextHopMatch = trimmedLine.match(/^NextHop\s*:\s*(?<nexthop>\S+)\s+LocPrf\s*:\s*(?<locprf>.*)/i);
        if (nextHopMatch) {
            this.currentRoute.next_hop = nextHopMatch.groups.nexthop;
            this.currentRoute.loc_prf = this._parseValue(nextHopMatch.groups.locprf);
            return true;
        }


        let medMatch = trimmedLine.match(/^MED\s*:\s*(?<med>.*)\s+PrefVal\s*:\s*(?<prefval>.*)/i);
        if (medMatch) {
            this.currentRoute.med = this._parseValue(medMatch.groups.med);
            this.currentRoute.pref_val = this._parseValue(medMatch.groups.prefval);
            return true;
        }


        let labelMatch = trimmedLine.match(/^Label\s*:\s*(?<label>.*)/i);
        if (labelMatch) {
            this.currentRoute.label = this._parseValue(labelMatch.groups.label);
            return true;
        }


        let pathMatch = trimmedLine.match(/^Path\/Ogn\s*:\s*(?<path>.*)/i);
        if (pathMatch) {
            this.currentRoute.path_ogn = this._parseValue(pathMatch.groups.path);


            this.currentRoute = null;
            return true;
        }


        return super.parseLine(line);
    }


    _parseValue(value) {
        const trimmed = value.trim();


        if (trimmed === '') {
            return null;
        }


        if (trimmed.includes(' ') || trimmed.includes('?') || trimmed.includes('i') || trimmed.includes('e')) {
            return trimmed;
        }


        const num = parseInt(trimmed, 10);
        return !isNaN(num) && String(num) === trimmed ? num : trimmed;
    }
}


module.exports = DisplayBgpVpnv6RoutingTableParser;