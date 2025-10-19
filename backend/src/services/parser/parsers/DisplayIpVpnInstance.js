const BaseParser = require('../core/BaseParser');


class DisplayIpVpnInstanceParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_ip_vpn_instance_block';
        this.priority = 10;

        this.rules = [
            {
                name: 'table_header',
                regex: /^\s*VPN-Instance Name\s+RD\s+Address-family/,
                handler: () => {
                    
                }
            },
            {
                
                name: 'data_row_with_rd',
                regex: /^\s*(?<Name>\S+)\s+(?<RD>\S+)\s+(?<Family>IPv4|IPv6)\s*$/,
                handler: (match) => {
                    this.data.vpn_instances.push({
                        name: match.groups.Name,
                        rd: match.groups.RD,
                        family: match.groups.Family,
                    });
                }
            },
            {
                
                name: 'data_row_no_rd',
                regex: /^\s*(?<Name>\S+)\s+(?<Family>IPv4|IPv6)\s*$/,
                handler: (match) => {
                    this.data.vpn_instances.push({
                        name: match.groups.Name,
                        rd: null, 
                        family: match.groups.Family,
                    });
                }
            }
        ];

        
        this.addValidationRule({
            name: 'vpn_instances_array_required',
            validate: (data) => Array.isArray(data.vpn_instances) && data.vpn_instances.length > 0,
            message: 'At least one VPN instance must be parsed'
        });

        this.addValidationRule({
            name: 'vpn_instance_data_valid',
            validate: (data) => {
                return data.vpn_instances.every(vpn =>
                    vpn.name &&
                    vpn.family &&
                    (vpn.rd === null || typeof vpn.rd === 'string')
                );
            },
            message: 'All VPN instances must have valid data (name, family, and rd)'
        });
    }

    
    isEntryPoint(line) {
        const regex = /^\s*VPN-Instance Name\s+RD\s+Address-family/;
        return line.match(regex);
    }

    
    startBlock(line, match) {
        super.startBlock(line, match);

        this.data = {
            ...this.data,
            vpn_instances: [], 
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

        if (!this.data || !this.data.vpn_instances) return;

        this.data.vpn_instances.forEach((vpn) => {
            
            if (vpn.rd && !/^\S+$/.test(vpn.rd)) {
                this._addWarning(`Invalid RD format for VPN-Instance ${vpn.name}: ${vpn.rd}`);
            }

            
        });
    }
}

module.exports = DisplayIpVpnInstanceParser;