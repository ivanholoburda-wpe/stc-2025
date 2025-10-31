const BaseParser = require('../core/BaseParser');


class DisplayVxlanTunnelParser extends BaseParser {

    constructor() {
        super();
        this.name = 'display_vxlan_tunnel_block';
        this.currentVpnInstance = null;
    }

    isEntryPoint(line) {
        return line.includes('display vxlan tunnel all');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data,
            vpn_instances: []
        };
        this.currentVpnInstance = null;
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
            trimmedLine.startsWith('Tunnel ID') ||
            trimmedLine.startsWith('---')) {
            return true;
        }


        let vpnMatch = trimmedLine.match(/^Vpn Instance Name\s*:\s*(?<name>\S+)/i);
        if (vpnMatch) {
            const newVpn = {
                name: vpnMatch.groups.name,
                total_tunnels: 0,
                tunnels: []
            };
            this.data.vpn_instances.push(newVpn);
            this.currentVpnInstance = newVpn;
            return true;
        }


        if (!this.currentVpnInstance) {

            return true;
        }


        let countMatch = trimmedLine.match(/^Number of vxlan tunnel\s*:\s*(?<count>\d+)/i);
        if (countMatch) {
            this.currentVpnInstance.total_tunnels = parseInt(countMatch.groups.count, 10);
            return true;
        }


        let tunnelMatch = trimmedLine.match(/^(?<tunnel_id>\d+)\s+(?<source>\S+)\s+(?<destination>\S+)\s+(?<state>\S+)\s+(?<type>\S+)\s+(?<uptime>\S+)$/);
        if (tunnelMatch) {
            this._addTunnel(this.currentVpnInstance.tunnels, tunnelMatch.groups);
            return true;
        }


        return super.parseLine(line);
    }


    _addTunnel(targetArray, groups) {
        targetArray.push({
            tunnel_id: parseInt(groups.tunnel_id, 10),
            source: groups.source,
            destination: groups.destination,
            state: groups.state,
            type: groups.type,
            uptime: groups.uptime
        });
    }
}


module.exports = DisplayVxlanTunnelParser;