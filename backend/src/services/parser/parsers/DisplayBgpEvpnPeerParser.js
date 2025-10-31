const BaseParser = require('../core/BaseParser');

class DisplayBgpEvpnPeerParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_bgp_evpn_peer_block';
    }

    isEntryPoint(line) {
        return line.includes('display bgp evpn peer');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            type: this.name,
            global_info: {},
            peers: [],
        };
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith('Peer      ')) {
            return true;
        }

        let kvMatch = trimmedLine.match(/^(?<key>BGP local router ID|Local AS number|Total number of peers|Peers in established state)\s*:\s*(?<value>.*)/i);
        if (kvMatch) {
            this._parseGlobalInfo(kvMatch.groups);
            return true;
        }

        const peerMatch = trimmedLine.match(/^(?<peer>\S+)\s+(?<v>\d+)\s+(?<as>\S+)\s+(?<msg_rcvd>\d+)\s+(?<msg_sent>\d+)\s+(?<out_q>\d+)\s+(?<up_down>\S+)\s+(?<state>\S+)\s+(?<pref_rcv>\d+)$/);
        if (peerMatch) {
            this._addPeer(this.data.peers, peerMatch.groups);
            return true;
        }

        return true;
    }

    isBlockComplete(line) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            return false;
        }
        return super.isBlockComplete(line);
    }

    // --- 🔥 ДОДАНО ВІДСУТНІ ДОПОМІЖНІ МЕТОДИ 🔥 ---

    _addPeer(targetArray, groups) {
        targetArray.push({
            peer: groups.peer,
            version: parseInt(groups.v, 10),
            as_number: groups.as,
            msg_received: parseInt(groups.msg_rcvd, 10),
            msg_sent: parseInt(groups.msg_sent, 10),
            out_queue: parseInt(groups.out_q, 10),
            up_down_time: groups.up_down,
            state: groups.state,
            prefixes_received: parseInt(groups.pref_rcv, 10),
        });
    }

    _parseGlobalInfo(groups) {
        const key = this._normalizeKey(groups.key);
        const value = groups.value;

        if (key === 'total_number_of_peers') {
            const stats = value.match(/(\d+)\s+Peers in established state\s*:\s*(\d+)/);
            if (stats) {
                this.data.global_info['total_peers'] = parseInt(stats[1], 10);
                this.data.global_info['established_peers'] = parseInt(stats[2], 10);
            } else {
                this.data.global_info['total_peers'] = this._parseValue(value);
            }
        } else if (key === 'peers_in_established_state') {
            this.data.global_info['established_peers'] = this._parseValue(value);
        } else {
            this.data.global_info[key] = this._parseValue(value);
        }
    }

    _normalizeKey(key) { return key.trim().toLowerCase().replace(/\s+/g, '_'); }
    _parseValue(value) {
        const trimmed = value.trim();
        if (trimmed.includes('.') || trimmed.includes('*')) return trimmed;
        const num = parseInt(trimmed, 10);
        return !isNaN(num) && String(num) === trimmed ? num : trimmed;
    }
}

module.exports = DisplayBgpEvpnPeerParser;