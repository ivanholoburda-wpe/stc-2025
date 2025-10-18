const BaseParser = require('../core/BaseParser');

class DisplayIpInterfaceBriefParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_ip_interface_brief_block';
        this.priority = 10;

        this.rules = [
            {
                name: 'summary_line',
                regex: /^The number of interface that is (?<State>UP|DOWN) in (?<Type>Physical|Protocol) is (?<Count>\d+)/,
                handler: (match) => {
                    const {State, Type, Count} = match.groups;
                    const key = `${Type.toLowerCase()}_${State.toLowerCase()}`;
                    this.data.summary[key] = parseInt(Count, 10);
                }
            },
            {
                name: 'data_row',
                regex: /^(?<Interface>\S+)\s+(?<IPAddressMask>.+?)\s+(?<Physical>\S+)\s+(?<Protocol>\S+)\s+(?<VPN>\S+)\s*$/,
                handler: (match) => {
                    const {Interface, IPAddressMask, Physical, Protocol, VPN} = match.groups;

                    if (Interface === 'Interface' && IPAddressMask.startsWith('IP Address/Mask')) {
                        return;
                    }

                    let interfaceName = match.groups.Interface;
                    interfaceName = interfaceName.replace(/\(.*?\)$/, '');

                    this.data.interfaces.push({
                        interface: interfaceName,
                        ip_address_mask: IPAddressMask.trim() === 'unassigned' ? null : IPAddressMask.trim(),
                        physical: Physical,
                        protocol: Protocol,
                        vpn: VPN === '--' ? null : VPN,
                    });
                }
            },
            {
                name: 'legend_or_header',
                regex: /^\s*(\*down:|!down:|Interface|----)/,
                handler: () => {
                }
            }
        ];

        this.addValidationRule({
            name: 'interfaces_array_required',
            validate: (data) => Array.isArray(data.interfaces) && data.interfaces.length > 0,
            message: 'At least one interface must be parsed from the table'
        });
    }

    isEntryPoint(line) {
        const regex = /^\s*Interface\s+IP Address\/Mask\s+Physical\s+Protocol\s+VPN/;
        return line.match(regex);
    }

    startBlock(line, match) {
        super.startBlock(line, match);

        this.data = {
            ...this.data,
            summary: {
                physical_up: 0,
                physical_down: 0,
                protocol_up: 0,
                protocol_down: 0,
            },
            interfaces: [],
        };
    }

    parseLine(line) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            return true;
        }
        return super.parseLine(line);
    }

    _validateData() {
        super._validateData();
        if (!this.data || !this.data.interfaces) return;

        this.data.interfaces.forEach(iface => {
            if (!iface.physical.includes('up') && !iface.physical.includes('down')) {
                this._addWarning(`Invalid Physical status for interface ${iface.interface}: ${iface.physical}`);
            }
            if (!iface.protocol.includes('up') && !iface.protocol.includes('down')) {
                this._addWarning(`Invalid Protocol status for interface ${iface.interface}: ${iface.protocol}`);
            }
        });

        const actualPhysicalUp = this.data.interfaces.filter(i => i.physical.includes('up')).length;
        const actualPhysicalDown = this.data.interfaces.filter(i => i.physical.includes('down')).length;
        const actualProtocolUp = this.data.interfaces.filter(i => i.protocol.includes('up')).length;
        const actualProtocolDown = this.data.interfaces.filter(i => i.protocol.includes('down')).length;

        if (this.data.summary.physical_up !== actualPhysicalUp) {
            this._addWarning(`Summary mismatch: expected ${this.data.summary.physical_up} Physical UP interfaces, but found ${actualPhysicalUp}.`);
        }
        if (this.data.summary.physical_down !== actualPhysicalDown) {
            this._addWarning(`Summary mismatch: expected ${this.data.summary.physical_down} Physical DOWN interfaces, but found ${actualPhysicalDown}.`);
        }
        if (this.data.summary.protocol_up !== actualProtocolUp) {
            this._addWarning(`Summary mismatch: expected ${this.data.summary.protocol_up} Protocol UP interfaces, but found ${actualProtocolUp}.`);
        }
        if (this.data.summary.protocol_down !== actualProtocolDown) {
            this._addWarning(`Summary mismatch: expected ${this.data.summary.protocol_down} Protocol DOWN interfaces, but found ${actualProtocolDown}.`);
        }
    }
}

module.exports = DisplayIpInterfaceBriefParser;