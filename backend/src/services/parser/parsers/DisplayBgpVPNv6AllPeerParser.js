const BaseParser = require('../core/BaseParser');

class DisplayBgpVpnv6PeerParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_bgp_vpnv6_peer_block';
        this.currentVpnInstance = null;
    }

    isEntryPoint(line) {
        return line.includes('display bgp vpnv6 all peer');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        // Убедимся, что this.data инициализируется правильно
        this.data = {
            ...this.data, // Сохраняем 'type', 'raw_line', 'parsed_at' из BaseParser
            global_info: {},
            vpn_instances: [],
        };
        this.currentVpnInstance = null;
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith('Peer      ') || line.includes('Peer of IPv6-family for vpn instance')) {
            return true;
        }

        let kvMatch = trimmedLine.match(/^(?<key>BGP local router ID|Local AS number|Total number of peers|Peers in established state)\s*:\s*(?<value>.*)/i);
        if (kvMatch) {
            this._parseGlobalInfo(kvMatch.groups);
            return true;
        }

        const vpnHeaderMatch = trimmedLine.match(/^VPN-Instance\s+(?<name>[^,]+),\s+Router ID\s+(?<router_id>\S+):/);
        if (vpnHeaderMatch) {
            const newVpn = { name: vpnHeaderMatch.groups.name.trim(), router_id: vpnHeaderMatch.groups.router_id, peers: [] };
            this.data.vpn_instances.push(newVpn);
            this.currentVpnInstance = newVpn;
            return true;
        }

        // --- 🔥 ИЗМЕНЕНИЕ 1: Регулярное выражение исправлено ---
        // (?<state>\S+) -> (?<state>.+?)   (чтобы захватить состояния с пробелами, например "Idle (Admin)")
        // (?<pref_rcv>\d+) -> (?<pref_rcv>\S+) (чтобы захватить дефис '-' вместо числа)
        const peerMatch = trimmedLine.match(/^(?<peer>\S+)\s+(?<v>\d+)\s+(?<as>\S+)\s+(?<msg_rcvd>\d+)\s+(?<msg_sent>\d+)\s+(?<out_q>\d+)\s+(?<up_down>\S+)\s+(?<state>.+?)\s+(?<pref_rcv>\S+)$/);

        if (this.currentVpnInstance && peerMatch) {
            this._addPeer(this.currentVpnInstance.peers, peerMatch.groups);
            return true;
        }

        // Если строка не распознана, базовый класс BaseParser добавит 'Unrecognized line'
        // Но мы можем вернуть false, чтобы он это сделал
        return super.parseLine(line); // Передаем не-trimmed, т.к. parseLine в BaseParser делает trim
    }

    isBlockComplete(line) {
        const trimmedLine = line.trim();
        // Пустая строка не должна завершать блок, если мы внутри
        if (!trimmedLine) {
            return false;
        }
        // Используем логику BaseParser для завершения
        return super.isBlockComplete(line);
    }

    // --- Вспомогательные методы ---

    _addPeer(targetArray, groups) {
        targetArray.push({
            peer: groups.peer,
            version: parseInt(groups.v, 10),
            as_number: groups.as,
            msg_received: parseInt(groups.msg_rcvd, 10),
            msg_sent: parseInt(groups.msg_sent, 10),
            out_queue: parseInt(groups.out_q, 10),
            up_down_time: groups.up_down,
            state: groups.state.trim(), // Добавляем trim() на случай лишних пробелов

            // --- 🔥 ИЗМЕНЕНИЕ 2: Используем _parseValue для обработки '-' ---
            // parseInt(groups.pref_rcv, 10) вернет NaN для '-',
            // а _parseValue вернет саму строку '-' или число
            prefixes_received: this._parseValue(groups.pref_rcv),
        });
    }

    _parseGlobalInfo(groups) {
        const key = this._normalizeKey(groups.key);
        const value = groups.value;

        if (key === 'total_number_of_peers') {
            const stats = value.match(/(\d+)\s+Peers in established state\s*:\s*(\d+)/);
            if (stats) {
                this.data.global_info['total_peers'] = parseInt(stats[1], 10);
                this.data.global_info['established_peers'] = parseInt(stats[2], 10);
            } else {
                this.data.global_info['total_peers'] = this._parseValue(value);
            }
        } else if (key === 'peers_in_established_state') {
            // Этот 'else if' нужен, только если 'Total number' не содержит 'Peers in established state'
            if (!this.data.global_info['established_peers']) {
                this.data.global_info['established_peers'] = this._parseValue(value);
            }
        } else {
            this.data.global_info[key] = this._parseValue(value);
        }
    }

    _normalizeKey(key) { return key.trim().toLowerCase().replace(/\s+/g, '_'); }

    _parseValue(value) {
        const trimmed = value.trim();
        // Расширяем защиту для строк, которые не являются числами
        if (trimmed === '-' || trimmed === '***' || trimmed.includes('.') || trimmed.includes(':')) {
            return trimmed;
        }
        const num = parseInt(trimmed, 10);
        return !isNaN(num) && String(num) === trimmed ? num : trimmed;
    }
}

// Не забудьте экспортировать класс
module.exports = DisplayBgpVpnv6PeerParser;