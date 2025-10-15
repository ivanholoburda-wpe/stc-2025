const BaseParser = require('../core/BaseParser');

class DisplayDeviceParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_device_block';

    this.rules = [
      {
        name: 'data_row',
        regex: /^\s*(?<slot>\d+)\s+(?<type>\S+)\s+(?<online>\S+)\s+(?<register>\S+)\s+(?<status>\S+)\s+(?<role>\S+)\s+(?<lsid>\d+)\s+(?<primary>\S+)\s*$/,
        handler: (match) => {
          this.data.devices.push({
            slot: parseInt(match.groups.slot, 10),
            type: match.groups.type,
            online: match.groups.online,
            register: match.groups.register,
            status: match.groups.status,
            role: match.groups.role,
            lsid: parseInt(match.groups.lsid, 10),
            primary: match.groups.primary,
          });
        }
      },
      {
        name: 'ignore_lines',
        regex: /^(?:Slot #\s+Type|----)/,
        handler: () => {
        }
      }
    ];
  }

  isEntryPoint(line) {
    const regex = /^(?<model>[\w\s-]+)'s Device status:/;
    return line.match(regex);
  }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      model: match.groups.model,
      devices: [],
    };
  }
}

module.exports = DisplayDeviceParser;