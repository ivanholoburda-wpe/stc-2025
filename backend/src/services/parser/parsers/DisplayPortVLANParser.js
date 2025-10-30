const BaseParser = require('../core/BaseParser');

class DisplayPortVlanParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_port_vlan_block';

        this.lastPortEntry = null;
    }

    isEntryPoint(line) {
        return line.includes('Port') && line.includes('Link Type') && line.includes('PVID') && line.includes('Trunk VLAN List');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            type: this.name,
            ports: [],
        };
        this.lastPortEntry = null;
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        if (!trimmedLine ||
            trimmedLine.startsWith('---') ||
            (line.includes('Port') && line.includes('Link Type') && line.includes('PVID')))
        {
            this.lastPortEntry = null;
            return true;
        }

        const newPortMatch = line.match(/^(?<port>\S+)\s+(?<link_type>\S+)\s+(?<pvid>\d+)\s+(?<vlan_list>.*)$/);
        if (newPortMatch) {
            const newPort = {
                port: newPortMatch.groups.port,
                link_type: newPortMatch.groups.link_type,
                pvid: parseInt(newPortMatch.groups.pvid, 10),
                vlan_list: newPortMatch.groups.vlan_list.trim(),
            };

            this.data.ports.push(newPort);
            this.lastPortEntry = newPort;
            return true;
        }

        const continuationMatch = line.match(/^\s{30,}(?<vlan_continuation>.*)$/);
        if (this.lastPortEntry && continuationMatch) {
            this.lastPortEntry.vlan_list += continuationMatch.groups.vlan_continuation.trim();
            return true;
        }

        this.lastPortEntry = null;
        return true;
    }

    endBlock() {
        if (this.data && this.data.ports) {
            this.data.ports.forEach(port => {
                if (port.vlan_list) {

                    const cleanedList = port.vlan_list.replace(/\s+/g, '');

                    if (cleanedList === '-') {
                        port.vlan_list = null;
                    } else {
                        port.vlan_list = cleanedList;
                    }
                }
            });
        }
        super.endBlock();
    }
}

module.exports = DisplayPortVlanParser;