const BaseParser = require('../core/BaseParser');


class DisplayBgpPeerParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_bgp_peer_block';
        this.priority = 50;

        this.rules = [
            {
                name: 'local_as',
                regex: /^\s*local AS number\s+:\s+(?<as>\d+)/,
                handler: (match) => {
                    this.data.local_as = parseInt(match.groups.as, 10);
                }
            },
            {
                name: 'total_peers',
                regex: /^\s*Total number of peers\s+:\s+(?<total>\d+)/,
                handler: (match) => {
                    this.data.total_peers = parseInt(match.groups.total, 10);
                }
            },

            
            {
                name: 'established_peers',
                
                regex: /^\s*Peers in established state\s+:\s+(?<established>\d+)\s*$/,
                handler: (match) => {
                    this.data.established_peers = parseInt(match.groups.established, 10);
                }
            },
            {
                name: 'table_header',
                
                regex: /^\s*Peer\s+V\s+AS\s+MsgRcvd\s+MsgSent\s+OutQ\s+Up\/Down\s+State\s+PrefRcv\s*$/,
                handler: () => {
                    
                }
            },
            

            {
                name: 'peer_data_row',
                regex: /^\s*(?<peer>\S+)\s+(?<version>\d+)\s+(?<as>\d+)\s+(?<msgRcvd>\d+)\s+(?<msgSent>\d+)\s+(?<outQ>\d+)\s+(?<upDown>\S+)\s+(?<state>\S+)\s+(?<prefRcv>\d+)\s*$/,
                handler: (match) => {
                    this.data.peers.push({
                        peer: match.groups.peer,
                        version: parseInt(match.groups.version, 10),
                        as: parseInt(match.groups.as, 10),
                        msg_rcvd: parseInt(match.groups.msgRcvd, 10),
                        msg_sent: parseInt(match.groups.msgSent, 10),
                        out_q: parseInt(match.groups.outQ, 10),
                        up_down_time: match.groups.upDown,
                        state: match.groups.state,
                        pref_rcv: parseInt(match.groups.prefRcv, 10),
                    });
                }
            }
        ];

        this.addValidationRule({
            name: 'router_id_and_as_required',
            validate: (data) => data.router_id && data.local_as,
            message: 'BGP Router ID and Local AS must be parsed'
        });

        this.addValidationRule({
            name: 'peer_count_match',
            validate: (data) => Array.isArray(data.peers) && data.peers.length === data.total_peers,
            message: 'Parsed peer count does not match total count'
        });
    }

    isEntryPoint(line) {
        const regex = /^\s*BGP Local router ID\s+:\s+(?<routerId>\S+)/;
        return line.match(regex);
    }

    startBlock(line, match) {
        super.startBlock(line, match);

        this.data = {
            ...this.data,
            router_id: match.groups.routerId,
            local_as: null,
            total_peers: 0,
            established_peers: 0,
            peers: [],
        };
    }

    

    
    isBlockComplete(line) {
        const trimmedLine = line.trim();

        
        if (!trimmedLine) {
            return false;
        }

        
        if (trimmedLine.startsWith('<')) {
            return true;
        }

        
        
        if (this.isEntryPoint(trimmedLine)) {
            return trimmedLine !== this.data.raw_line.trim();
        }

        return false;
    }

    _validateData() {
        super._validateData();

        if (!this.data) return;

        
        const establishedCount = this.data.peers.filter(p => p.state === 'Established').length;
        if (establishedCount !== this.data.established_peers) {
            this._addWarning('Parsed established peer count does not match summary count');
        }

        this.data.peers.forEach((peer) => {
            if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(peer.peer)) {
                this._addWarning(`Invalid peer IP address: ${peer.peer}`);
            }
            if (peer.state === 'Idle') {
                this._addWarning(`Peer ${peer.peer} is in Idle state`);
            }
        });
    }
}

module.exports = DisplayBgpPeerParser;