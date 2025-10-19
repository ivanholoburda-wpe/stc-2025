const BaseParser = require('../core/BaseParser');


class DisplayMplsL2vcParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_mpls_l2vc_block';
        this.priority = 50;

        this.rules = [
            
            {
                name: 'session_state',
                regex: /^\s*session state\s+:\s+(?<state>\S+)/,
                handler: (match) => { this.data.session_state = match.groups.state; }
            },
            {
                name: 'vc_id',
                regex: /^\s*VC ID\s+:\s+(?<id>\d+)/,
                handler: (match) => { this.data.vc_id = parseInt(match.groups.id, 10); }
            },
            {
                name: 'vc_type',
                regex: /^\s*VC type\s+:\s+(?<type>\S+)/,
                handler: (match) => { this.data.vc_type = match.groups.type; }
            },
            {
                name: 'destination',
                regex: /^\s*destination\s+:\s+(?<dest>\S+)/,
                handler: (match) => { this.data.destination = match.groups.dest; }
            },

            
            {
                name: 'ac_status',
                regex: /^\s*AC status\s+:\s+(?<acStatus>\S+)/,
                handler: (match) => { this.data.ac_status = match.groups.acStatus; }
            },
            {
                name: 'ignore_ac_state',
                regex: /^\s*Ignore AC state\s+:\s+(?<ignoreAc>\S+)/,
                handler: (match) => { this.data.ignore_ac_state = match.groups.ignoreAc; }
            },
            {
                name: 'vc_state',
                regex: /^\s*VC state\s+:\s+(?<vcState>\S+)/,
                handler: (match) => { this.data.vc_state = match.groups.vcState; }
            },
            

            
            {
                name: 'vc_labels',
                regex: /^\s*local VC label\s+:\s+(?<local>\d+)\s+remote VC label\s+:\s+(?<remote>\d+)/,
                handler: (match) => {
                    this.data.labels = {
                        local: parseInt(match.groups.local, 10),
                        remote: parseInt(match.groups.remote, 10)
                    };
                }
            },
            {
                name: 'vc_mtu',
                regex: /^\s*local VC MTU\s+:\s+(?<local>\d+)\s+remote VC MTU\s+:\s+(?<remote>\d+)/,
                handler: (match) => {
                    this.data.mtu = {
                        local: parseInt(match.groups.local, 10),
                        remote: parseInt(match.groups.remote, 10)
                    };
                }
            },

            
            {
                name: 'create_time',
                regex: /^\s*create time\s+:\s+(?<time>.+)/,
                handler: (match) => { this.data.create_time = match.groups.time.trim(); }
            },
            {
                name: 'up_time',
                regex: /^\s*up time\s+:\s+(?<time>.+)/,
                handler: (match) => { this.data.up_time = match.groups.time.trim(); }
            },
            {
                name: 'last_up_time',
                regex: /^\s*VC last up time\s+:\s+(?<time>.+)/,
                handler: (match) => { this.data.last_up_time = match.groups.time.trim(); }
            },

            
            {
                name: 'tunnel_summary',
                regex: /^\s*VC tunnel\/token info\s+:\s+(?<count>\d+) tunnels?\/tokens?/,
                handler: (match) => { this.data.tunnels.count = parseInt(match.groups.count, 10); }
            },
            {
                name: 'tunnel_primary',
                regex: /^\s*NO\.0\s+TNL type\s+:\s+(?<type>\S+)\s+,\s+TNL ID\s+:\s+(?<id>\S+)/,
                handler: (match) => {
                    this.data.tunnels.primary = {
                        type: match.groups.type,
                        id: match.groups.id
                    };
                }
            },
            {
                name: 'tunnel_backup',
                regex: /^\s*Backup TNL type\s+:\s+(?<type>\S+)\s+,\s+TNL ID\s+:\s+(?<id>\S+)/,
                handler: (match) => {
                    this.data.tunnels.backup = {
                        type: match.groups.type,
                        id: match.groups.id
                    };
                }
            },

            
            {
                name: 'ignore_simple_kv',
                regex: /^\s*(Administrator PW|Label state|Token state|control word|remote control word|forwarding entry|local group ID|remote group ID|local AC OAM State|local PSN OAM State|local forwarding state|local status code|remote AC OAM state|remote PSN OAM state|remote forwarding state|remote status code|ignore standby state|BFD for PW|VCCV State|manual fault|active state|link state|local VCCV|remote VCCV|tunnel policy name|PW template name|primary or secondary|load balance type|Access-port|Switchover Flag|CKey|NKey|PW redundancy mode|AdminPw interface|AdminPw link state|Diffserv Mode|Service Class|Color|DomainId|Domain Name|VC total up time|last change time)\s*:/,
                handler: () => {  }
            },
        ];


        
        this.addValidationRule({
            name: 'vc_id_and_destination_required',
            validate: (data) => data.vc_id && data.destination,
            message: 'VC ID and Destination are required'
        });
        this.addValidationRule({
            name: 'vc_state_up',
            validate: (data) => data.vc_state && data.vc_state.toUpperCase() === 'UP',
            message: 'VC state is not UP'
        });
    }

    
    isEntryPoint(line) {
        
        const regex = /^\s*\*client interface\s+:\s+(?<iface>\S+)\s+is\s+(?<state>up|down|administratively down)/i;
        return line.match(regex);
    }

    
    startBlock(line, match) {
        super.startBlock(line, match);

        this.data = {
            ...this.data,
            interface: match.groups.iface,
            interface_state: match.groups.state.toLowerCase(),
            session_state: null,
            ac_status: null,
            ignore_ac_state: null,
            vc_state: null,
            vc_id: null,
            vc_type: null,
            destination: null,
            labels: {},
            mtu: {},
            tunnels: {
                count: 0,
                primary: null,
                backup: null
            },
            create_time: null,
            up_time: null,
            last_up_time: null,
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

        if (this.data.interface_state !== 'up') {
            this._addWarning(`Client interface ${this.data.interface} is ${this.data.interface_state}`);
        }
        if (this.data.vc_state !== 'up') {
            this._addWarning(`VC state is ${this.data.vc_state}`);
        }
        if (!this.data.labels.local || !this.data.labels.remote) {
            this._addWarning(`VC labels seem incomplete`);
        }
    }
}

module.exports = DisplayMplsL2vcParser;