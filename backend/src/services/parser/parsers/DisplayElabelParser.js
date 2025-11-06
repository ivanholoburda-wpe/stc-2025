const BaseParser = require('../core/BaseParser');

class DisplayElabelParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_elabel_block';
    }

    isEntryPoint(line) {
        return line.includes('display elabel');
    }

    startBlock(line, match) {
        super.startBlock(line, match);

        this.data = {
            type: this.name,
            backplane: null,
            slots: [],
            power_frames: [],
            fan_slots: [],
            pmu_boards: [],
        };

        this.currentSlot = null;
        this.currentDaughterBoard = null;
        this.currentPowerFrame = null;
        this.currentFanSlot = null;
        this.currentPmuBoard = null;

        this.tempPMTarget = null;

        this.currentPropertiesTarget = null;
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            return true;
        }

        if (trimmedLine.startsWith('/$') && trimmedLine !== '/$[Board Properties]') {
            return true;
        }

        let match;

        match = trimmedLine.match(/^\[BackPlane\]$/);
        if (match) {
            this.data.backplane = {};
            this.currentPropertiesTarget = this.data.backplane;
            this._resetContext('slot', 'power', 'fan', 'pmu');
            return true;
        }

        match = trimmedLine.match(/^\[Slot_(\d+)\]$/);
        if (match) {
            this.currentSlot = {
                slot_number: this._parseValue(match[1]),
                main_boards: [],
                daughter_boards: [],
            };
            this.data.slots.push(this.currentSlot);
            this.currentPropertiesTarget = null;
            this._resetContext('power', 'fan', 'pmu', 'daughter');
            return true;
        }

        match = trimmedLine.match(/^\[PowerFrame_(\d+)\]$/);
        if (match) {
            this.currentPowerFrame = {
                frame_number: this._parseValue(match[1]),
                power_modules: [],
            };
            this.data.power_frames.push(this.currentPowerFrame);
            this.currentPropertiesTarget = null;
            this._resetContext('slot', 'fan', 'pmu');
            return true;
        }

        match = trimmedLine.match(/^\[FanSlot_(\d+)\]$/);
        if (match) {
            this.currentFanSlot = {
                slot_number: this._parseValue(match[1]),
                fan_frame: null,
            };
            this.data.fan_slots.push(this.currentFanSlot);
            this.currentPropertiesTarget = null;
            this._resetContext('slot', 'power', 'pmu');
            return true;
        }

        match = trimmedLine.match(/^\[PmuBoard_(\d+)\]$/);
        if (match) {
            this.currentPmuBoard = {
                board_number: this._parseValue(match[1]),
                main_board: null,
            };
            this.data.pmu_boards.push(this.currentPmuBoard);
            this.currentPropertiesTarget = null;
            this._resetContext('slot', 'power', 'fan');
            return true;
        }

        match = trimmedLine.match(/^PM:\s*(\d+)\[(.+)\]$/);
        if (match && this.currentPowerFrame) {
            const newPM = {
                pm_number: this._parseValue(match[1]),
                pm_name: match[2],
                main_board: null,
            };
            this.currentPowerFrame.power_modules.push(newPM);
            this.currentPropertiesTarget = null;
            this.tempPMTarget = newPM;
            return true;
        }

        match = trimmedLine.match(/^FanFrame$/);
        if (match && this.currentFanSlot) {
            const newFanFrame = {};
            this.currentFanSlot.fan_frame = newFanFrame;
            this.currentPropertiesTarget = newFanFrame;
            return true;
        }

        match = trimmedLine.match(/^\[Main_Board_(\d+)\]$/);
        if (match) {
            const newBoard = {
                board_index: this._parseValue(match[1])
            };

            if (this.tempPMTarget) {
                this.tempPMTarget.main_board = newBoard;
                this.tempPMTarget = null;
            } else if (this.currentSlot) {
                this.currentSlot.main_boards.push(newBoard);
            } else if (this.currentPmuBoard) {
                this.currentPmuBoard.main_board = newBoard;
            }

            this.currentPropertiesTarget = newBoard;
            this.currentDaughterBoard = null;
            return true;
        }

        match = trimmedLine.match(/^\[Daughter_Board_(\d+)\/(\d+)\]$/);
        if (match && this.currentSlot) {
            const newDaughterBoard = {
                slot_number: this._parseValue(match[1]),
                sub_slot: this._parseValue(match[2]),
                ports: [],
            };
            this.currentSlot.daughter_boards.push(newDaughterBoard);
            this.currentDaughterBoard = newDaughterBoard;
            this.currentPropertiesTarget = newDaughterBoard;
            return true;
        }

        match = trimmedLine.match(/^\[Port_(\d+)\]$/);
        if (match && this.currentDaughterBoard) {
            const newPort = {
                port_number: this._parseValue(match[1]),
            };
            this.currentDaughterBoard.ports.push(newPort);
            this.currentPropertiesTarget = newPort;
            return true;
        }

        if (trimmedLine === '[Board Properties]') {
            return true;
        }

        match = trimmedLine.match(/^(?<key>[^=]+)=(?<value>.*)/);
        if (match && this.currentPropertiesTarget) {
            try {
                const key = this._normalizeKey(match.groups.key);
                const value = this._parseValue(match.groups.value.trim());

                this.currentPropertiesTarget[key] = value;
            } catch (e) {
                console.error(`Error parsing key-value: ${line}`, e);
            }
            return true;
        }

        return true;
    }

    _resetContext(...contexts) {
        if (contexts.includes('slot')) this.currentSlot = null;
        if (contexts.includes('daughter')) this.currentDaughterBoard = null;
        if (contexts.includes('power')) this.currentPowerFrame = null;
        if (contexts.includes('fan')) this.currentFanSlot = null;
        if (contexts.includes('pmu')) this.currentPmuBoard = null;
    }

    _normalizeKey(key) {
        return key.trim().toLowerCase().replace(/\s+/g, '_');
    }

    _parseValue(value) {
        const trimmed = value.trim();

        if (trimmed.includes('.') || trimmed.includes('*') || /^[a-zA-Z]/.test(trimmed)) {
            return trimmed;
        }

        const num = parseInt(trimmed, 10);

        return !isNaN(num) && String(num) === trimmed ? num : trimmed;
    }

    isBlockComplete(line) {
        return super.isBlockComplete(line);
    }
}

module.exports = DisplayElabelParser;