const BaseParser = require('../../../../../../Users/Professional/Desktop/stc-2025-parser/parser/core/BaseParser');

class DisplayLicenseInfoParser extends BaseParser {
    constructor() {
        super();
        
        this.name = 'display_license_info_block';

        this.rules = [
            {
                
                name: 'key_value_pair',
                
                regex: /^\s*(?<key>.+?)\s*:\s*(?<value>.*)$/,
                handler: (match) => {
                    const { key, value } = match.groups;
                    if (!key.trim()) return; 

                    const normalizedKey = this._normalizeKey(key);
                    const parsedValue = this._parseValue(value);

                    this.data[normalizedKey] = parsedValue;
                }
            },
            {
                
                name: 'ignore_stars',
                regex: /^\s*\*{5,}\s*$/, 
                handler: () => {  }
            }
        ];
    }

    
    isEntryPoint(line) {
        return line.trim().startsWith('Active License');
    }

    
    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            type: this.name,
        };
        
        this.parseLine(line);
    }

    
    isBlockComplete(line) {
         const trimmedLine = line.trim();
         
         if (trimmedLine.startsWith('---') || trimmedLine.startsWith('Feature name')) {
             return true;
         }
         
         return super.isBlockComplete(line);
    }

    _normalizeKey(key) {
        
        return key.trim().toLowerCase().replace(/[^a-z0-9_\s]/g, '').replace(/\s+/g, '_');
    }

    _parseValue(value) {
        const trimmed = value.trim();
        
        return trimmed === '' ? null : trimmed;
    }
}

module.exports = DisplayLicenseInfoParser;