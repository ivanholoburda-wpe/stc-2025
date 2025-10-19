const BaseParser = require('../core/BaseParser');


class DisplayIsisPeerParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_isis_peer_block';
        this.priority = 50;

        this.rules = [
            {
                name: 'data_row',
                
                regex: /^\s*(?<systemId>\S+)\s+(?<interface>\S+)\s+(?<circuitId>\S+)\s+(?<state>\S+)\s+(?<holdTime>\d+)\s+(?<type>\S+)\s+(?<priority>\d+)\s*$/,
                handler: (match) => {
                    this.data.peers.push({
                        system_id: match.groups.systemId,
                        interface: match.groups.interface,
                        circuit_id: match.groups.circuitId,
                        state: match.groups.state,
                        hold_time: parseInt(match.groups.holdTime, 10),
                        type: match.groups.type,
                        priority: parseInt(match.groups.priority, 10),
                    });
                }
            },
            {
                name: 'total_row',
                regex: /^\s*Total Peer\(s\):\s*(?<total>\d+)\s*$/,
                handler: (match) => {
                    this.data.total_peers = parseInt(match.groups.total, 10);
                }
            },
            {
                name: 'table_header',
                regex: /^\s*System ID\s+Interface\s+Circuit ID/,
                handler: () => {
                    
                }
            },
            {
                name: 'separator_line',
                regex: /^\s*[-]+\s*$/,
                handler: () => {
                    
                }
            }
        ];

        
        this.addValidationRule({
            name: 'process_id_required',
            validate: (data) => typeof data.process_id === 'number',
            message: 'ISIS Process ID must be parsed'
        });

        this.addValidationRule({
            name: 'peers_array_required',
            validate: (data) => Array.isArray(data.peers),
            message: 'Peers array must be initialized'
        });

        this.addValidationRule({
            name: 'peer_count_match',
            validate: (data) => data.peers.length === data.total_peers,
            message: 'Parsed peer count does not match total count'
        });
    }

    
    isEntryPoint(line) {
        const regex = /^\s*Peer Information for ISIS\((?<processId>\d+)\)/;
        return line.match(regex);
    }

    
    startBlock(line, match) {
        super.startBlock(line, match);

        this.data = {
            ...this.data,
            process_id: parseInt(match.groups.processId, 10),
            peers: [],
            total_peers: 0,
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

        if (!this.data || !this.data.peers) return;

        
        this.data.peers.forEach((peer) => {
            if (!['Up', 'Down', 'Init'].includes(peer.state)) {
                this._addWarning(`Unknown peer state for ${peer.system_id}: ${peer.state}`);
            }
            if (peer.priority < 0 || peer.priority > 127) {
                this._addWarning(`Invalid priority for ${peer.system_id}: ${peer.priority}`);
            }
        });
    }
}

module.exports = DisplayIsisPeerParser;