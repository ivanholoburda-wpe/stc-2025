const BaseParser = require('../core/BaseParser');

class DisplayArpAllParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_arp_all_block';
    
    this.lastArpEntry = null;
  }

  isEntryPoint(line) {
    return line.includes('IP ADDRESS') && line.includes('MAC ADDRESS') && line.includes('EXPIRE(M)');
  }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      summary: {},
      entries: [],
    };
    this.lastArpEntry = null;
  }

  parseLine(line) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('---') || trimmedLine.startsWith('IP ADDRESS') || trimmedLine.startsWith('VLAN/CEVLAN')) {
      return true;
    }

    const vlanMatch = trimmedLine.match(/^(?<vlan>\d+)\/(?<cevlan>\S+)$/);
    if (vlanMatch) {
      if (this.lastArpEntry) {
        this.lastArpEntry.vlan = parseInt(vlanMatch.groups.vlan, 10);
        this.lastArpEntry.cevlan = vlanMatch.groups.cevlan;
      }
      return true;
    }

    const summaryMatch = trimmedLine.match(/^Total:(?<total>\d+)/);
    if (summaryMatch) {
      this.data.summary.total = parseInt(summaryMatch.groups.total, 10);
      return true;
    }
    if (trimmedLine.startsWith('Redirect:')) { // Игнорируем вторую строку сводки
        return true;
    }

    const parts = trimmedLine.split(/\s+/);
    if (parts.length < 3) {
      return false;
    }

    if (!/^\d{1,3}\./.test(parts[0])) {
        return false;
    }

    const newEntry = {
      ip_address: parts.shift(),
      mac_address: parts.shift(),
      expire_m: null,
      type: null,
      interface: null,
      vpn_instance: null,
      vlan: null,
      cevlan: null
    };
    
    if (!isNaN(parseInt(parts[0], 10))) {
      newEntry.expire_m = parseInt(parts.shift(), 10);
    }
    
    let type = parts.shift();
    if (parts[0] === '-') {
      type += ` ${parts.shift()}`;
    }
    newEntry.type = type;

    newEntry.interface = parts.shift();

    if (parts.length > 0) {
      newEntry.vpn_instance = parts.join(' ');
    }

    this.data.entries.push(newEntry);
    this.lastArpEntry = newEntry;
    return true;
  }
}

module.exports = DisplayArpAllParser;