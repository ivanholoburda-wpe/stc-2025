class DisplayInterfaceBriefParser {
  name = 'display_interface_brief_block';
  priority = 10;
  data = null;

  constructor() {
    this.rules = [
      {
        name: 'data_row',
        regex: /^(?<Interface>\S+)\s+(?<PHY>\S+)\s+(?<Protocol>\S+)\s+(?<InUti>\S+)\s+(?<OutUti>\S+)\s+(?<inErrors>\d+)\s+(?<outErrors>\d+)\s*$/,
        handler: (match) => {
          this.data.interfaces.push({
            interface: match.groups.Interface,
            phy_status: match.groups.PHY,
            protocol_status: match.groups.Protocol,
            in_utilization: match.groups.InUti,
            out_utilization: match.groups.OutUti,
            in_errors: parseInt(match.groups.inErrors, 10),
            out_errors: parseInt(match.groups.outErrors, 10),
          });
        }
      },
      {
        name: 'table_header',
        regex: /^\s*Interface\s+PHY\s+Protocol/,
        handler: () => {}
      }
    ];
  }


  isEntryPoint(line) {
    const regex = /^\s*Interface\s+PHY\s+Protocol/;
    return line.match(regex);
  }

  startBlock(line, match) { 
    this.data = {
      type: this.name,
      interfaces: [],
    };
  }

  parseLine(line) {
    const trimmedLine = line.trim();
    if (trimmedLine === '') return;

    for (const rule of this.rules) {
      const match = trimmedLine.match(rule.regex);
      if (match) {
        rule.handler(match);
        return;
      }
    }
  }

  isBlockComplete(line) {
    return line.trim().startsWith('<') || this.isEntryPoint(line);
  }
  
  getResult() {
    return this.data;
  }
}

module.exports = new DisplayInterfaceBriefParser();