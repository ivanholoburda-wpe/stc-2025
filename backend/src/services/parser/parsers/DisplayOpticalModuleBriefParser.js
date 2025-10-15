const BaseParser = require('../core/BaseParser');

class DisplayOpticalModuleBriefParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_optical_module_brief_block';
    
    this.lastModule = null;
  }

  isEntryPoint(line) {
    return line.includes('Port') && line.includes('Status') && line.includes('RxPower');
  }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      modules: [],
    };
    this.lastModule = null;
  }

  parseLine(line) {
    const laneMatch = line.match(/^\s{10,}(?<wavelength>\S+)\s+(?<rx_power>\S+)\s+(?<tx_power>\S+)/);
    if (laneMatch) {
      if (this.lastModule) {
        this.lastModule.lanes.push({
          wavelength: laneMatch.groups.wavelength,
          rx_power_dbm: this._parsePower(laneMatch.groups.rx_power),
          tx_power_dbm: this._parsePower(laneMatch.groups.tx_power),
        });
      }
      return true;
    }

    const mainMatch = line.match(/^(?<port>\S+)\s+(?<status>\S+)\s+(?<duplex>\S+)\s+(?<type>\S+)\s+(?<wavelength>\S+)\s+(?<rx_power>\S+)\s+(?<tx_power>\S+)\s+(?<mode>\S+)\s+(?<vendor_pn>\S+)/);
    if (mainMatch) {
      const newModule = {
        port: mainMatch.groups.port,
        status: mainMatch.groups.status,
        duplex: mainMatch.groups.duplex,
        type: mainMatch.groups.type,
        wavelength: mainMatch.groups.wavelength,
        rx_power_dbm: this._parsePower(mainMatch.groups.rx_power),
        tx_power_dbm: this._parsePower(mainMatch.groups.tx_power),
        mode: mainMatch.groups.mode,
        vendor_pn: mainMatch.groups.vendor_pn,
        lanes: [],
      };
      
      this.data.modules.push(newModule);
      this.lastModule = newModule;
      return true;
    }

    return true;
  }

  _parsePower(powerStr) {
    const num = parseFloat(powerStr);
    return isNaN(num) ? null : num;
  }
}

module.exports = DisplayOpticalModuleBriefParser;