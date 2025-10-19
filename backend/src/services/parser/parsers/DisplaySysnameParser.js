const BaseParser = require('../core/BaseParser');

class DisplaySysnameParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_sysname_block'; 

        this.rules = [
            {
                
                name: 'sysname_line',
                regex: /^sysname\s+(?<hostname>\S+)/,
                handler: (match) => {
                    
                    this.data.sysname = match.groups.hostname;
                }
            }
        ];
    }

    
    isEntryPoint(line) {
        
        return line.trim().startsWith('sysname');
    }

    
    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            type: this.name,
            sysname: null 
        };
        
        this.parseLine(line);
    }

    
    isBlockComplete(line) {
        
        
        
        if (this.data && this.data.sysname !== null) {
            return true;
        }
        
        return super.isBlockComplete(line);
    }
}

module.exports = DisplaySysnameParser;