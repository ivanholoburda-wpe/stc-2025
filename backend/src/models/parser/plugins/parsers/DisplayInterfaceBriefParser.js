class DisplayInterfaceBriefParser {
  name = 'display_interface_brief_block';
  priority = 10;
  data = null;

  constructor() {
    this.rules = [
      {
        name: 'data_row',
        regex: /^\s*(?<Interface>\S+)\s+(?<PHY>\S+)\s+(?<Protocol>\S+)\s+(?<InUti>\S+)\s+(?<OutUti>\S+)\s+(?<inErrors>\d+)\s+(?<outErrors>\d+)\s*$/,
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
      },
      {
        name: 'info_or_empty_line',
        regex: /^(PHY:|InUti\/OutUti:|\*down:|^\s*\(|\[Huawei\]|^\s*$)/,
        handler: () => {}
      }
    ];
  }

  /**
   * ИЗМЕНЕНО: Используем .includes() вместо .startsWith() для надежности.
   * Теперь парсер сработает, даже если перед командой есть имя устройства.
   * @param {string} line - Строка из лога.
   * @returns {boolean}
   */
  isEntryPoint(line) {
    // Просто проверяем, содержит ли строка команду, а не начинается ли с нее.
    return line.includes('display interface brief');
  }

  startBlock(line) { // `match` здесь не нужен, так как isEntryPoint возвращает true/false
    this.data = {
      type: this.name,
      interfaces: [],
    };
  }

  parseLine(line) {
    for (const rule of this.rules) {
      const match = line.match(rule.regex);
      if (match) {
        rule.handler(match);
        return;
      }
    }
  }

  isBlockComplete(line) {
    return line.trim().startsWith('<');
  }
  
  getResult() {
    return this.data;
  }
}

module.exports = new DisplayInterfaceBriefParser();