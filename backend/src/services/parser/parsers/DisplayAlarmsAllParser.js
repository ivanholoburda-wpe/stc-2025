const BaseParser = require('../core/BaseParser');

class DisplayAlarmAllParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_alarm_all_block';
    this.currentAlarm = null;
  }

  isEntryPoint(line) {
    return /^Index\s+Level\s+Date\s+Time\s+Info/.test(line);
  }

  startBlock(line) {
    super.startBlock(line);
    this.data = {
      ...this.data,
      alarms: [],
    };
    this.currentAlarm = null;
  }

  parseLine(line) {
    const alarmStartRegex = /^\s*(?<Index>\d+)\s+(?<Level>\S+)\s+(?<Date>\d{4}-\d{2}-\d{2})\s+(?<Time>[\d:.]+\+\d{2}:\d{2}(?:\s+DST)?)\s+(?<Info>.*)$/;
    const match = line.match(alarmStartRegex);

    if (match) {
      this._commitCurrentAlarm();

      this.currentAlarm = {
        index: parseInt(match.groups.Index, 10),
        level: match.groups.Level,
        date: match.groups.Date,
        time: match.groups.Time.replace(/\s+DST$/, ''), 
        info: match.groups.Info.trim(),
      };

    } else if (this.currentAlarm && line.trim()) {
      this.currentAlarm.info += ' ' + line.trim();
    }

    return true;
  }

  endBlock() {
    this._commitCurrentAlarm();
    super.endBlock();
  }

  _commitCurrentAlarm() {
    if (this.currentAlarm) {
      this.currentAlarm.info = this.currentAlarm.info.replace(/\s+/g, ' ').trim();

      const oidMatch = this.currentAlarm.info.match(/ID:([\d.]+)/);
      const entCodeMatch = this.currentAlarm.info.match(/Code:(\d+)/);

      this.currentAlarm.oid = oidMatch ? oidMatch[1] : null;
      this.currentAlarm.ent_code = entCodeMatch ? parseInt(entCodeMatch[1], 10) : null;
      
      this.data.alarms.push(this.currentAlarm);
      
      this.currentAlarm = null;
    }
  }
}

module.exports = DisplayAlarmAllParser;