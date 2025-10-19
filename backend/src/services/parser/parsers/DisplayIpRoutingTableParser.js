const BaseParser = require('../core/BaseParser');

class DisplayIpRoutingTableParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_ip_routing_table_block';
        this.priority = 10;

        this.rules = [
            {
                name: 'data_row',
                regex: /^\s*(?<Dest>\S+)\s+(?<Proto>\S+)\s+(?<Pre>\d+)\s+(?<Cost>\d+)\s+(?<Flags>\S+)\s+(?<NextHop>\S+)\s+(?<Interface>\S+)\s*$/,
                handler: (match) => {
                    this.data.routes.push({
                        destination_mask: match.groups.Dest,
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
                handler: () => {
                    
                }
            }
        ];

        
        this.addValidationRule({
            name: 'routes_array_required',
            validate: (data) => Array.isArray(data.routes) && data.routes.length > 0,
            message: 'At least one route must be parsed'
        });

        this.addValidationRule({
            name: 'route_data_valid',
            validate: (data) => {
                return data.routes.every(route =>
                    route.destination_mask &&
                    route.protocol &&
                    typeof route.preference === 'number' &&
                    typeof route.cost === 'number' &&
                    route.next_hop &&
                    route.interface
                );
            },
            message: 'All routes must have valid data'
        });
    }

    isEntryPoint(line) {
        const regex = /^\s*Destination\/Mask\s+Proto\s+Pre\s+Cost\s+Flags\s+NextHop\s+Interface/;
        return line.match(regex);
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data,
            routes: [],
        };
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        
        
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

        
        if (this.isEntryPoint(line) && trimmedLine !== this.data.raw_line.trim()) {
            return true;
        }

        return false;
    }

    _validateData() {
        super._validateData();

        if (!this.data || !this.data.routes) return;

        this.data.routes.forEach((route) => {
            if (route.preference < 0) {
                this._addWarning(`Negative preference for route ${route.destination_mask}`);
            }
            if (route.cost < 0) {
                this._addWarning(`Negative cost for route ${route.destination_mask}`);
            }

            const ipMaskRegex = /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/;
            if (!ipMaskRegex.test(route.destination_mask)) {
                this._addWarning(`Invalid Destination/Mask format for route: ${route.destination_mask}`);
            }
        });
    }
}

module.exports = DisplayIpRoutingTableParser;