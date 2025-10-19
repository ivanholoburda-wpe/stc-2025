const BaseParser = require('../core/BaseParser');


class DisplayOspfInterfaceVerboseParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_ospf_interface_verbose_block';
        this.priority = 50;

        this.rules = [
            {
                name: 'cost_state_type_mtu',
                
                regex: /^\s*Cost: (?<cost>\d+)\s+State: (?<state>\S+)\s+Type: (?<ifType>\S+)\s+MTU: (?<mtu>\d+)\s*$/,
                handler: (match) => {
                    this.data.cost = parseInt(match.groups.cost, 10);
                    this.data.state = match.groups.state;
                    
                    this.data.interface_type = match.groups.ifType;
                    this.data.mtu = parseInt(match.groups.mtu, 10);
                }
            },
            {
                name: 'timers',
                regex: /^\s*Timers: Hello (?<hello>\d+) , Dead (?<dead>\d+) , Wait (?<wait>\d+) , Poll (?<poll>\d+) , Retransmit (?<retransmit>\d+) , Transmit Delay (?<delay>\d+)\s*$/,
                handler: (match) => {
                    this.data.timers = {
                        hello: parseInt(match.groups.hello, 10),
                        dead: parseInt(match.groups.dead, 10),
                        wait: parseInt(match.groups.wait, 10),
                        poll: parseInt(match.groups.poll, 10),
                        retransmit: parseInt(match.groups.retransmit, 10),
                        transmit_delay: parseInt(match.groups.delay, 10),
                    };
                }
            },
            {
                name: 'bfd_timers',
                regex: /^\s*BFD Timers: Tx-Interval (?<tx>\d+) , Rx-Interval (?<rx>\d+) , Multiplier (?<multi>\d+)\s*$/,
                handler: (match) => {
                    this.data.bfd_timers = {
                        tx_interval: parseInt(match.groups.tx, 10),
                        rx_interval: parseInt(match.groups.rx, 10),
                        multiplier: parseInt(match.groups.multi, 10),
                    };
                }
            },
            {
                name: 'bandwidth',
                regex: /Bandwidth:\s+(?<bw>\S+ \S+)\s+Remain-Bandwidth:\s+(?<rem_bw>\S+ \S+)/,
                handler: (match) => {
                    this.data.bandwidth = match.groups.bw;
                    this.data.remain_bandwidth = match.groups.rem_bw;
                }
            },
            {
                name: 'stats_header',
                regex: /^\s*Packet Statistics/,
                handler: () => {  }
            },
            {
                name: 'stats_table_header',
                regex: /^\s*Type\s+Input\s+Output/,
                handler: () => {  }
            },
            {
                name: 'packet_stats_row',
                regex: /^\s*(Hello|DB Description|Link-State Req|Link-State Update|Link-State Ack)\s+(?<input>\d+)\s+(?<output>\d+)\s*$/,
                handler: (match) => {
                    let type = match[1];
                    if (type === 'DB Description') type = 'db_description';
                    else if (type === 'Link-State Req') type = 'lsr';
                    else if (type === 'Link-State Update') type = 'lsu';
                    else if (type === 'Link-State Ack') type = 'lsack';
                    else type = type.toLowerCase();

                    this.data.statistics[type] = {
                        input: parseInt(match.groups.input, 10),
                        output: parseInt(match.groups.output, 10),
                    };
                }
            },

            
            {
                name: 'ignore_mpls_te',
                regex: /^\s*MPLS Traffic-Engineering Link/,
                handler: () => {  }
            },
            {
                name: 'ignore_allspf',
                regex: /^\s*ALLSPF GROUP/,
                handler: () => {  }
            },
            {
                name: 'ignore_effective_cost',
                regex: /^\s*Effective cost/,
                handler: () => {  }
            },
            {
                name: 'ignore_bfd_wtr',
                regex: /^\s*Bfd Incr-Cost Wtr RemainTime/,
                handler: () => {  }
            },
            {
                name: 'ignore_link_quality',
                regex: /^\s*Link quality adjust cost:/,
                handler: () => {  }
            },
            {
                name: 'ignore_flapping_peer',
                regex: /^\s*Suppress flapping peer:/,
                handler: () => {  }
            },
            {
                name: 'ignore_multi_area',
                regex: /^\s*Multi-area Interface/,
                handler: () => {  }
            },
            {
                name: 'ignore_label_depth',
                regex: /^\s*Label Stack Depth:/,
                handler: () => {  }
            },
            {
                name: 'ignore_opaque_id',
                regex: /^\s*OpaqueId:/,
                handler: () => {  }
            }
        ];

        this.addValidationRule({
            name: 'interface_data_required',
            validate: (data) => data.interface && data.ip && data.neighbor_ip,
            message: 'Interface, IP, and Neighbor IP are required'
        });
        this.addValidationRule({
            name: 'cost_and_state_required',
            validate: (data) => data.cost >= 0 && data.state,
            message: 'Valid Cost and State are required'
        });
    }

    isEntryPoint(line) {
        
        const regex = /Interface:\s*(?<ip>\S+)\s*\((?<iface>[^\)]+)\)\s*-->\s*(?<neighbor>\S+)/;
        return line.match(regex);
    }

    startBlock(line, match) {
        super.startBlock(line, match);

        this.data = {
            ...this.data,
            ip: match.groups.ip,
            interface: match.groups.iface,
            neighbor_ip: match.groups.neighbor,
            cost: null,
            state: null,
            
            interface_type: null,
            mtu: null,
            timers: {},
            bfd_timers: {},
            bandwidth: null,
            remain_bandwidth: null,
            statistics: {
                hello: { input: 0, output: 0 },
                db_description: { input: 0, output: 0 },
                lsr: { input: 0, output: 0 },
                lsu: { input: 0, output: 0 },
                lsack: { input: 0, output: 0 },
            }
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

        
        if (trimmedLine.startsWith('Area:')) {
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
        if (this.data.mtu && this.data.mtu < 64) {
            this._addWarning('MTU seems unusually low', this.data.mtu.toString());
        }
    }
}

module.exports = DisplayOspfInterfaceVerboseParser;