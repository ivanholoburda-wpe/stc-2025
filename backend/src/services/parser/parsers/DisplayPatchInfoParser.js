const BaseParser = require('../../../../../../Users/Professional/Desktop/stc-2025-parser/parser/core/BaseParser');

class DisplayPatchInfoParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_patch_info_block';

        this.rules = [
            {
                name: 'no_patch_info',
                regex: /^Info:\s+No patch exists./,
                handler: (match) => {
                    this.data.patch_exists = false;
                }
            },
            {
                
                name: 'key_value_pair',
                regex: /^(?<key>Patch Package Name|Patch Package Version|The current state is)\s*:\s*(?<value>.*)/,
                handler: (match) => {
                    const normalizedKey = this._normalizeKey(match.groups.key);
                    this.data[normalizedKey] = match.groups.value.trim();
                    
                    if (this.data.patch_exists === null) {
                        this.data.patch_exists = true;
                    }
                }
            },
            {
                name: 'patch_detail_row',
                regex: /^(?<type>\S+)\s+(?<state>\S+)\s+(?<count>\d+)\s+(?<time>.*)$/,
                handler: (match) => {
                    
                    if (this.data.patch_exists === true) {
                        if (!this.data.details) {
                            this.data.details = [];
                        }
                        this.data.details.push({
                            type: match.groups.type,
                            state: match.groups.state,
                            count: parseInt(match.groups.count, 10),
                            time: match.groups.time.trim(),
                        });
                    }
                }
            },
            {
                name: 'ignore_lines',
                regex: /(^\*{5,}|^-{5,}|^Type\s+State\s+Count)/,
                handler: () => {  }
            }
        ];
    }

    isEntryPoint(line) {
        const trimmedLine = line.trim();
        return trimmedLine.startsWith('Patch Package Name') || trimmedLine.startsWith('Info: No patch exists.');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            type: this.name,
            patch_exists: null,
            patch_package_name: null,
            patch_package_version: null,
            the_current_state_is: null, 
            details: null
        };
        this.parseLine(line);
    }

    endBlock() {
        if (this.data.patch_exists === false) {
            delete this.data.patch_package_name;
            delete this.data.patch_package_version;
            delete this.data.details;
            
        } else if (this.data.patch_exists === true && this.data.the_current_state_is === null) {
            
            
        }
        super.endBlock();
    }


    _normalizeKey(key) {
        
        return key.trim().toLowerCase().replace(/\s+/g, '_');
    }
}

module.exports = DisplayPatchInfoParser;