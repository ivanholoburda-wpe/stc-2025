const BaseParser = require('../../../../../../Users/Professional/Desktop/stc-2025-parser/parser/core/BaseParser');

class DisplayFanDetailParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_fan_detail_block';
        
        this.parsingFanSpeeds = false;
    }

    
    isEntryPoint(line) {
        const regex = /^FAN\s+(?<id>\S+)'s detail information:/;
        return line.match(regex);
    }

    /**
     * Ініціалізація структури даних
     */
    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            type: this.name,
            fan_id: match.groups.id, // Зберігаємо ID (наприклад, "8")
            fan_speeds_percent: {}, // Об'єкт для зберігання швидкостей { fan_number: speed }
        };
        this.parsingFanSpeeds = false; 
    }

    
    parseLine(line) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('---')) {
            return true; 
        }

        

        
        if (trimmedLine.startsWith('FanSpeed  : [No.]Speed')) {
            this.parsingFanSpeeds = true;
            return true; 
        }

        

        if (this.parsingFanSpeeds) {
            
            
            const speedMatches = trimmedLine.matchAll(/\[(?<num>\d+)\]\s+(?<speed>\d+)%/g);
            let foundSpeed = false;
            for (const match of speedMatches) {
                const fanNumber = parseInt(match.groups.num, 10);
                const speedPercent = parseInt(match.groups.speed, 10);
                this.data.fan_speeds_percent[fanNumber] = speedPercent;
                foundSpeed = true;
            }

            
            
            if (foundSpeed) {
                return true;
            } else {
                
                this.parsingFanSpeeds = false;
                
            }
        }

        
        const kvMatch = trimmedLine.match(/^\s*(?<key>[A-Za-z]+)\s*:\s*(?<value>.*)$/);
        if (kvMatch) {
            const { key, value } = kvMatch.groups;
            
            if (key !== 'Fan') {
                const normalizedKey = this._normalizeKey(key);
                const parsedValue = this._parseValue(value);
                this.data[normalizedKey] = parsedValue;
            }
            return true;
        }

        
        return false;
    }

    _normalizeKey(key) {
        return key.trim().toLowerCase().replace(/\s+/g, '_');
    }

    _parseValue(value) {
        const trimmed = value.trim();
        if (trimmed === '') return null;
        if (trimmed === 'PRESENT' || trimmed === 'REGISTERED' || trimmed === 'WORK') return true;
        if (trimmed === 'ABSENT' || trimmed === 'UNREGISTERED') return false; 
        if (trimmed === 'NORMAL') return trimmed; 

        
        const num = parseInt(trimmed, 10);
        return !isNaN(num) && String(num) === trimmed ? num : trimmed;
    }
}

module.exports = DisplayFanDetailParser;