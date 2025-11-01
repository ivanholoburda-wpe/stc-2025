const BaseParser = require('../core/BaseParser');

class DisplayETrunkBriefParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_etrunk_brief_block';
        this.priority = 10;

        this.rules = [
            {
                name: 'etrunk_data_row',
                regex: /^\s*(?<id>\d+)\s+(?<state>\S+)\s+(?<vpn_instance>\S+)\s+(?<peer_ip>\S+)\s+(?<source_ip>\S+)\s*$/,
                handler: (match) => {
                    this.data.etrunks.push({
                        id: parseInt(match.groups.id, 10),
                        state: match.groups.state,
                        vpn_instance: match.groups.vpn_instance,
                        peer_ip: match.groups.peer_ip,
                        source_ip: match.groups.source_ip,
                    });
                }
            },
            {
                name: 'header_skip',
                regex: /E-TRUNK-ID\s+State\s+VPN-Instance/,
                handler: () => {
                }
            },
            {
                name: 'divider_skip',
                regex: /^-+$/,
                handler: () => {
                }
            }
        ];
    }

    isEntryPoint(line) {
        return /E-TRUNK-ID\s+State\s+VPN-Instance\s+Peer-IP\s+Source-IP/.test(line);
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data,
            etrunks: []
        };
    }

    isBlockComplete(line) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            return false;
        }

        if (trimmedLine.startsWith('---')) {
            return false;
        }

        return super.isBlockComplete(line);
    }

}

module.exports = DisplayETrunkBriefParser;