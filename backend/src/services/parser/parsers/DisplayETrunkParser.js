const BaseParser = require('../core/BaseParser');

class DisplayETrunkDetailParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_etrunk_detail_block';
        this.priority = 10;
        this.currentSection = 'etrunk_info';
    }

    isEntryPoint(line) {
        return line.includes('The E-Trunk information');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data,
            etrunk_info: {},
            members: []
        };
        this.currentSection = 'etrunk_info';
    }

    isBlockComplete(line) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            return false;
        }

        if (super.isBlockComplete(line)) {
            return true;
        }

        if (this.isEntryPoint(line) && trimmedLine !== this.data.raw_line.trim()) {
            return true;
        }

        return false;
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith('---')) {
            return true;
        }

        if (trimmedLine.includes('The E-Trunk information')) {
            this.currentSection = 'etrunk_info';
            return true;
        }

        if (trimmedLine.includes('The Member information')) {
            this.currentSection = 'member_info';
            return true;
        }

        if (this.currentSection === 'etrunk_info') {
            this._parseEtrunkInfo(trimmedLine);
        } else if (this.currentSection === 'member_info') {
            this._parseMemberInfo(trimmedLine);
        }

        return true;
    }

    _parseEtrunkInfo(line) {
        const twoKeyMatch = line.match(/^(?<key1>.*?)\s*:\s*(?<value1>.*?)\s+(?<key2>.*?)\s*:\s*(?<value2>.*?)\s*$/);
        if (twoKeyMatch) {
            const { key1, value1, key2, value2 } = twoKeyMatch.groups;
            this.data.etrunk_info[this._normalizeKey(key1)] = this._parseValue(value1);
            this.data.etrunk_info[this._normalizeKey(key2)] = this._parseValue(value2);
            return;
        }

        const oneKeyMatch = line.match(/^(?<key1>.*?)\s*:\s*(?<value1>.*?)\s*$/);
        if (oneKeyMatch) {
            const { key1, value1 } = oneKeyMatch.groups;
            this.data.etrunk_info[this._normalizeKey(key1)] = this._parseValue(value1);
        }
    }

    _parseMemberInfo(line) {
        if (line.match(/Type\s+ID\s+LocalPhyState/)) {
            return;
        }

        const memberMatch = line.match(/^(?<type>\S+)\s+(?<id>\d+)\s+(?<local_phy_state>\S+)\s+(?<work_mode>\S+)\s+(?<state>\S+)\s+(?<causation>\S+)\s+(?<remote_id>\S+)\s*$/);
        if (memberMatch) {
            this.data.members.push({
                type: memberMatch.groups.type,
                id: parseInt(memberMatch.groups.id, 10),
                local_phy_state: memberMatch.groups.local_phy_state,
                work_mode: memberMatch.groups.work_mode,
                state: memberMatch.groups.state,
                causation: memberMatch.groups.causation,
                remote_id: this._parseValue(memberMatch.groups.remote_id)
            });
        }
    }

    _normalizeKey(key) {
        return key.trim().toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[()]/g, '');
    }

    _parseValue(value) {
        const trimmed = value.trim();

        if (trimmed === '-' || trimmed === '***') return trimmed;

        if (trimmed.includes('.') || trimmed.includes(':') || trimmed.includes('-')) {
            return trimmed;
        }

        const num = parseInt(trimmed, 10);
        return !isNaN(num) && String(num) === trimmed ? num : trimmed;
    }
}

module.exports = DisplayETrunkDetailParser;