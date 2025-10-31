const BaseParser = require('../core/BaseParser');

/**
 * Парсер для вывода команды 'display vxlan tunnel all'.
 * * Собирает информацию, сгруппированную по "Vpn Instance Name".
 * Каждый инстанс содержит сводную информацию и список туннелей.
 */
class DisplayVxlanTunnelParser extends BaseParser {

    constructor() {
        super();
        this.name = 'display_vxlan_tunnel_block';
        this.currentVpnInstance = null; // Контекст: текущий VPN-инстанс
    }

    isEntryPoint(line) {
        return line.includes('display vxlan tunnel all');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data, // Наследуем 'type', 'parsed_at'
            vpn_instances: []
        };
        this.currentVpnInstance = null;
    }

    /**
     * 🔥 Важное переопределение:
     * Пустые строки НЕ должны завершать этот блок,
     * так как они используются как разделители.
     */
    isBlockComplete(line) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            return false; // Продолжаем парсинг
        }
        return super.isBlockComplete(line);
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        // 1. Игнорируем пустые строки и заголовки/разделители
        if (!trimmedLine ||
            trimmedLine.startsWith('Tunnel ID') ||
            trimmedLine.startsWith('---')) {
            return true;
        }

        // 2. Ищем начало нового VPN-инстанса
        let vpnMatch = trimmedLine.match(/^Vpn Instance Name\s*:\s*(?<name>\S+)/i);
        if (vpnMatch) {
            const newVpn = {
                name: vpnMatch.groups.name,
                total_tunnels: 0,
                tunnels: []
            };
            this.data.vpn_instances.push(newVpn);
            this.currentVpnInstance = newVpn; // Устанавливаем текущий контекст
            return true;
        }

        // --- Все, что ниже, требует наличия 'currentVpnInstance' ---
        if (!this.currentVpnInstance) {
            // Если мы еще не встретили "Vpn Instance Name", игнорируем строку
            return true;
        }

        // 3. Ищем количество туннелей для текущего инстанса
        let countMatch = trimmedLine.match(/^Number of vxlan tunnel\s*:\s*(?<count>\d+)/i);
        if (countMatch) {
            this.currentVpnInstance.total_tunnels = parseInt(countMatch.groups.count, 10);
            return true;
        }

        // 4. Ищем данные самого туннеля
        // (ID, Source, Destination, State, Type, Uptime)
        let tunnelMatch = trimmedLine.match(/^(?<tunnel_id>\d+)\s+(?<source>\S+)\s+(?<destination>\S+)\s+(?<state>\S+)\s+(?<type>\S+)\s+(?<uptime>\S+)$/);
        if (tunnelMatch) {
            this._addTunnel(this.currentVpnInstance.tunnels, tunnelMatch.groups);
            return true;
        }

        // Передаем нераспознанную строку в BaseParser
        return super.parseLine(line);
    }

    // --- Вспомогательный метод ---

    _addTunnel(targetArray, groups) {
        targetArray.push({
            tunnel_id: parseInt(groups.tunnel_id, 10),
            source: groups.source,
            destination: groups.destination,
            state: groups.state,
            type: groups.type,
            uptime: groups.uptime
        });
    }
}

// Экспортируем класс
module.exports = DisplayVxlanTunnelParser;