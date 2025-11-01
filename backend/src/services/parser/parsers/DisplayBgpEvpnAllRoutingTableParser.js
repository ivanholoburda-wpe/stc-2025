const BaseParser = require('../core/BaseParser');


const REGEX_PRIMARY_ROUTE = /^(?<status>.+?)\s+(?<network>\S+[\.:]\S+)\s+(?<nexthop>\S+)$/;


const REGEX_SECONDARY_ROUTE = /^(?<status>.+?)\s{2,}(?<nexthop>\S+)$/;


class DisplayBgpEvpnRoutingTableParser extends BaseParser {

    constructor() {
        super();
        this.name = 'display_bgp_evpn_routing_table_block';

        this.currentContainer = null;
        this.currentRD = null;
        this.lastPrimaryRoute = null;
    }

    isEntryPoint(line) {
        return line.includes('display bgp evpn all routing-table');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data,
            global_info: {},
            evpn_address_family: {
                total_ad_routes: 0,
                route_distinguishers: []
            },
            evpn_instances: []
        };
        this.currentContainer = null;
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
            trimmedLine.startsWith('Origin :') ||
            trimmedLine.startsWith('RPKI validation codes:') ||
            trimmedLine.startsWith('Network(ESI/EthTagId)')) {
            return true;
        }


        let asMatch = trimmedLine.match(/^Local AS number\s*:\s*(?<as>\S+)/i);
        if (asMatch) {
            this.data.global_info.local_as = asMatch.groups.as;
            return true;
        }

        let routerIdMatch = trimmedLine.match(/^BGP Local router ID is (?<router_id>\S+)/i);
        if (routerIdMatch) {
            this.data.global_info.local_router_id = routerIdMatch.groups.router_id;
            return true;
        }


        if (trimmedLine.startsWith('EVPN address family:')) {
            this.currentContainer = this.data.evpn_address_family;
            this.currentRD = null;
            this.lastPrimaryRoute = null;
            return true;
        }

        let instanceMatch = trimmedLine.match(/^EVPN-Instance\s+(?<name>\S+):/i);
        if (instanceMatch) {
            const newInstance = {
                name: instanceMatch.groups.name,
                total_ad_routes: 0,
                routes: []
            };
            this.data.evpn_instances.push(newInstance);
            this.currentContainer = newInstance;
            this.currentRD = null;
            this.lastPrimaryRoute = null;
            return true;
        }


        if (!this.currentContainer) {
            return true;
        }

        let adCountMatch = trimmedLine.match(/^Number of A-D Routes:\s*(?<count>\d+)/i);
        if (adCountMatch) {
            this.currentContainer.total_ad_routes = parseInt(adCountMatch.groups.count, 10);
            return true;
        }

        let rdMatch = trimmedLine.match(/^Route Distinguisher:\s*(?<rd>\S+)/i);
        if (rdMatch && this.currentContainer === this.data.evpn_address_family) {
            const newRD = {
                rd: rdMatch.groups.rd,
                routes: []
            };
            this.currentContainer.route_distinguishers.push(newRD);
            this.currentRD = newRD;
            this.lastPrimaryRoute = null;
            return true;
        }


        let targetRouteArray = null;
        if (this.currentContainer === this.data.evpn_address_family) {
            if (this.currentRD) targetRouteArray = this.currentRD.routes;
        } else {
            targetRouteArray = this.currentContainer.routes;
        }

        if (!targetRouteArray) {
            return true;
        }


        let primaryMatch = trimmedLine.match(REGEX_PRIMARY_ROUTE);
        if (primaryMatch) {
            const route = this._createRouteObject(primaryMatch.groups);
            targetRouteArray.push(route);
            this.lastPrimaryRoute = route;
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
                targetRouteArray.push(path);
            }
            return true;
        }


        return super.parseLine(line);
    }


    _createRouteObject(groups) {
        return {

            status: groups.status.trim(),
            network: this._parseValue(groups.network),
            next_hop: this._parseValue(groups.nexthop)
        };
    }

    _parseValue(value) {
        if (value === undefined || value === null) return null;
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
    }
}


module.exports = DisplayBgpEvpnRoutingTableParser;