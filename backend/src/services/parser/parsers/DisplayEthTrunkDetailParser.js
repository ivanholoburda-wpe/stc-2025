const BaseParser = require('../core/BaseParser');

class DisplayEthTrunkDetailParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_eth_trunk_detail_block';
        this.currentTrunk = null;
        this.currentState = null;
    }

    isEntryPoint(line) {
        const regex = /^Eth-Trunk(?<id>\d+)'s state information is:/;
        return line.match(regex);
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            type: this.name,
            trunks: [],
        };
        this._startNewTrunk(match);
    }

    _startNewTrunk(match) {
        const newTrunk = {
            id: parseInt(match.groups.id, 10),
            mode_type: null,
            local_info: {},
            actor_ports: [],
            partner_ports: [],
            normal_ports: []
        };
        this.data.trunks.push(newTrunk);
        this.currentTrunk = newTrunk;
        this.currentState = 'parsing_local_info';
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        // 0. Перевірка на новий Eth-Trunk
        const entryMatch = line.match(/^Eth-Trunk(?<id>\d+)'s state information is:/);
        if (entryMatch) {
            if (!this.currentTrunk || this.currentTrunk.id !== parseInt(entryMatch.groups.id, 10)) {
                this._startNewTrunk(entryMatch);
            }
            return true;
        }

        if (!this.currentTrunk) return true;

        // 1. Ігноруємо порожні рядки та роздільники
        if (!trimmedLine || trimmedLine.startsWith('---')) {
            return true;
        }

        // === КІНЦЕВИЙ АВТОМАТ (STATE MACHINE) ===

        if (this.currentState === 'parsing_local_info') {
            // 2. Перевірка на перехід до таблиць
            if (trimmedLine.startsWith('ActorPortName')) {
                this.currentState = 'parsing_lacp_actor';
                return true;
            }
            if (trimmedLine.startsWith('Partner:')) {
                this.currentState = 'parsing_lacp_partner';
                return true;
            }
            if (trimmedLine.startsWith('PortName')) {
                this.currentState = 'parsing_normal_ports';
                return true;
            }

            // 3. 🔥 ВИПРАВЛЕНА ЛОГІКА: Парсимо кілька пар "ключ:значення" в рядку
            // Ця регулярка шукає ключ (до двокрапки) і значення (до наступного ключа або кінця рядка)
            // Вона також враховує, що ключ може починатися з пробілів (як у рядку 'Working Mode...')
            const kvPairsRegex = /\s*(?<key>[^:]+?):\s*(?<value>.*?)(?=\s{2,}[^:]+:|$)/g;

            let match;
            while ((match = kvPairsRegex.exec(line)) !== null) {
                if (match.groups.key && match.groups.key.trim()) {
                    const key = this._normalizeKey(match.groups.key);
                    const value = this._parseValue(match.groups.value);

                    this.currentTrunk.local_info[key] = value;

                    // 🔥 Ключовий момент: Визначаємо режим роботи
                    if (key === 'working_mode') {
                        // Перевіряємо, чи значення ПОЧИНАЄТЬСЯ з 'Normal' або 'Static'
                        if (String(value).startsWith('Normal')) {
                            this.currentTrunk.mode_type = 'Manual';
                        } else if (String(value).startsWith('Static')) {
                            this.currentTrunk.mode_type = 'LACP';
                        }
                    }
                }
            }
            return true;
        }

        // --- СТАН: Розбір таблиці Actor (LACP) ---
        if (this.currentState === 'parsing_lacp_actor') {
            if (trimmedLine.startsWith('Partner:')) {
                this.currentState = 'parsing_lacp_partner';
                return true;
            }
            const actorMatch = trimmedLine.match(/^(?<name>\S+)\s+(?<status>\S+)\s+(?<type>\S+)\s+(?<pri>\d+)\s+(?<no>\d+)\s+(?<key>\d+)\s+(?<state>\d+)\s+(?<weight>\d+)$/);
            if (actorMatch) {
                this.currentTrunk.actor_ports.push({
                    port_name: actorMatch.groups.name,
                    status: actorMatch.groups.status,
                    port_type: actorMatch.groups.type,
                    priority: parseInt(actorMatch.groups.pri, 10),
                    port_no: parseInt(actorMatch.groups.no, 10),
                    port_key: parseInt(actorMatch.groups.key, 10),
                    port_state: actorMatch.groups.state,
                    weight: parseInt(actorMatch.groups.weight, 10)
                });
            }
            return true;
        }

        // --- СТАН: Розбір таблиці Partner (LACP) ---
        if (this.currentState === 'parsing_lacp_partner') {
            if (trimmedLine.startsWith('ActorPortName')) return true; // Ігноруємо заголовок
            const partnerMatch = trimmedLine.match(/^(?<name>\S+)\s+(?<sys_pri>\d+)\s+(?<sys_id>\S+)\s+(?<port_pri>\d+)\s+(?<port_no>\d+)\s+(?<port_key>\d+)\s+(?<port_state>\d+)$/);
            if (partnerMatch) {
                this.currentTrunk.partner_ports.push({
                    port_name: partnerMatch.groups.name,
                    system_priority: parseInt(partnerMatch.groups.sys_pri, 10),
                    system_id: partnerMatch.groups.sys_id,
                    port_priority: parseInt(partnerMatch.groups.port_pri, 10),
                    port_no: parseInt(partnerMatch.groups.port_no, 10),
                    port_key: parseInt(partnerMatch.groups.port_key, 10),
                    port_state: partnerMatch.groups.port_state
                });
            }
            return true;
        }

        // --- СТАН: Розбір таблиці портів (Normal/Manual) ---
        if (this.currentState === 'parsing_normal_ports') {
            const normalMatch = trimmedLine.match(/^(?<name>\S+)\s+(?<status>\S+)\s+(?<weight>\d+)$/);
            if (normalMatch) {
                this.currentTrunk.normal_ports.push({
                    port_name: normalMatch.groups.name,
                    status: normalMatch.groups.status,
                    weight: parseInt(normalMatch.groups.weight, 10)
                });
            }
            return true;
        }

        return false;
    }

    _normalizeKey(key) {
        // Чистимо ключ від зайвих символів, наприклад, 'Local:'
        return key.trim().toLowerCase().replace('local:', '').trim().replace(/\s+/g, '_');
    }

    _parseValue(value) {
        const trimmed = value.trim();
        const num = parseInt(trimmed, 10);
        return !isNaN(num) && String(num) === trimmed ? num : trimmed;
    }
}

module.exports = DisplayEthTrunkDetailParser;