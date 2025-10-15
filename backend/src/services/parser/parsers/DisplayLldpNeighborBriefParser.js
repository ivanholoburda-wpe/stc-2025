const BaseParser = require('../core/BaseParser');

class DisplayLldpNeighborBriefParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_lldp_neighbor_brief_block';

    this.rules = [
      {
        name: 'neighbor_row',
        regex: /^\s*(?<local_intf>\S+)\s+(?<neighbor_dev>.+?)\s+(?<neighbor_intf>\S+)\s+(?<exptime>\d+)\s*$/,
        handler: (match) => {
          this.data.neighbors.push({
            local_interface: match.groups.local_intf,
            neighbor_device: match.groups.neighbor_dev.trim(),
            neighbor_interface: match.groups.neighbor_intf,
            expire_time_s: parseInt(match.groups.exptime, 10),
          });
        }
      },
      {
        name: 'ignore_lines',
        regex: /^(?:Local Intf|---)/,
        handler: () => {
        }
      }
    ];
  }

  isEntryPoint(line) {
    return line.includes('Local Intf') && line.includes('Neighbor Dev') && line.includes('Exptime');
  }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      neighbors: [],
    };
  }
}

module.exports = DisplayLldpNeighborBriefParser;