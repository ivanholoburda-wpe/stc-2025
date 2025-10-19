const BaseParser = require('../../../../../../Users/Professional/Desktop/stc-2025-parser/parser/core/BaseParser');

class DisplayPowerDetailParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_power_detail_block';
    }

    isEntryPoint(line) {
        const regex = /^PWR\s+(?<id>\S+)'s detail information:/;
        return line.match(regex);
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            type: this.name,
            power_id: match.groups.id,
        };
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        // 1. Ігноруємо рядки-роздільники '---'
        if (trimmedLine.startsWith('---')) {
            return true;
        }

        // 2. Намагаємося розібрати НЕПОРОЖНІ рядки як "ключ : значення"
        if (trimmedLine) {
            const kvMatch = trimmedLine.match(/^\s*(?<key>.+?)\s*:\s*(?<value>.*)$/);
            if (kvMatch) {
                const { key, value } = kvMatch.groups;
                if (key.trim()) {
                    const normalizedKey = this._normalizeKey(key);
                    const parsedValue = this._parseValue(value);
                    if (normalizedKey === 'type') {
                        this.data['power_supply_type'] = parsedValue;
                    } else {
                        this.data[normalizedKey] = parsedValue;
                    }
                }
                return true; // Рядок успішно оброблено (або проігноровано, якщо ключ порожній)
            }
        }

        // 3. Будь-які інші рядки (порожні, заголовки, що не збіглися з kvMatch)
        // вважаємо обробленими (проігнорованими)
        return true;
    }

    /**
     * 🔥 ПЕРЕВИЗНАЧЕННЯ ЛОГІКИ ЗАВЕРШЕННЯ БЛОКУ 🔥
     * Цей метод тепер буде використовуватися замість стандартного з BaseParser.
     */
    isBlockComplete(line) {
        const trimmedLine = line.trim();

        // 1. Точно зупиняємося, якщо бачимо командний рядок
        if (/^<.*>$/.test(trimmedLine)) {
            return true;
        }

        // 2. Зупиняємося, якщо поточний рядок є початком ІНШОГО блоку PWR detail
        // (Важливо: перевіряємо, що це не той самий рядок, з якого ми почали)
        if (/^PWR\s+\S+'s detail information:/.test(trimmedLine) && trimmedLine !== this.raw_line) {
            return true;
        }

        
        
        
        if (trimmedLine.startsWith('FAN ') && trimmedLine.includes("'s detail information:")) return true;
        if (trimmedLine.includes('IP ADDRESS') && trimmedLine.includes('MAC ADDRESS')) return true; 
        if (trimmedLine.includes('Destination/Mask') && trimmedLine.includes('Proto')) return true; 
        

        
        return false;
    }


    _normalizeKey(key) {
        return key.trim().toLowerCase().replace(/[^a-z0-9_\s]/g, '').replace(/\s+/g, '_');
    }

    _parseValue(value) {
        const trimmed = value.trim();
        if (trimmed === '') return null;
        if (trimmed === 'PRESENT') return true;
        if (trimmed === 'ABSENT') return false;
        if (trimmed === 'NORMAL' || trimmed === 'PLUG' || trimmed === 'DC') return trimmed;

        const num = parseFloat(trimmed);
        return !isNaN(num) && isFinite(num) && String(num) === trimmed.match(/^-?\d+(\.\d+)?$/)?.[0] ? num : trimmed;
    }
}

module.exports = DisplayPowerDetailParser;