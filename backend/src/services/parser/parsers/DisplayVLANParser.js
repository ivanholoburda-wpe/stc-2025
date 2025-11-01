const BaseParser = require('../core/BaseParser');

class DisplayVlanParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_vlan_block';

        this.rules = [
            {
                name: 'vlan_data_row',
                regex: /^\s*(?<vid>\d+)\s+(?<status>\S+)\s+(?<property>\S+)\s+(?<mac_lrn>\S+)\s+(?<statistics>\S+)\s+(?<description>.*)$/,
                handler: (match) => {
                    this.data.vlans.push({
                        vid: parseInt(match.groups.vid, 10),
                        status: match.groups.status,
                        property: match.groups.property,
                        mac_learn: match.groups.mac_lrn,
                        statistics: match.groups.statistics,
                        description: match.groups.description.trim(),
                    });
                }
            },
            {
                name: 'ignore_lines',
                regex: /^(?:VID\s+Status|---)/,
                handler: () => {
                }
            }
        ];
    }

    isEntryPoint(line) {
        return line.includes('VID') && line.includes('Status') && line.includes('MAC-LRN') && line.includes('Description');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            type: this.name,
            vlans: [],
        };
    }
}

module.exports = DisplayVlanParser;