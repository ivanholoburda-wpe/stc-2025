const BaseParser = require('../core/BaseParser');

/**
 * Регулярное выражение для основного маршрута (у которого есть 'Network').
 */
const REGEX_PRIMARY_ROUTE = /^(?<status>\S+)\s+(?<network>\S+)\s+(?<nexthop>\S+)\s+(?<med>\S*)\s+(?<locprf>\S*)\s+(?<prefval>\S+)\s+(?<path>.*)$/;

/**
 * Регулярное выражение для вторичного маршрута (где 'Network' пуст).
 * Ключевое отличие - \s{2,} (два или более пробела) после 'status'.
 */
const REGEX_SECONDARY_ROUTE = /^(?<status>\S+)\s{2,}(?<nexthop>\S+)\s+(?<med>\S*)\s+(?<locprf>\S*)\s+(?<prefval>\S+)\s+(?<path>.*)$/;


class DisplayBgpVpnv4RoutingTableParser extends BaseParser {

    constructor() {
        super();
        this.name = 'display_bgp_vpnv4_routing_table_block';
        this.currentRD = null;
        this.lastPrimaryRoute = null;
    }

    isEntryPoint(line) {
        return line.includes('display bgp vpnv4 all routing-table');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data,
            global_info: {},
            route_distinguishers: []
        };
        this.currentRD = null;
        this.lastPrimaryRoute = null;
    }

    isBlockComplete(line) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            return false; // Продолжаем парсинг
        }
        return super.isBlockComplete(line);
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        // 1. Пропускаем пустые строки и заголовки
        if (!trimmedLine ||
            trimmedLine.startsWith('Status codes:') ||
            trimmedLine.startsWith('RPKI validation codes:') ||
            trimmedLine.startsWith('Network      ')) {
            return true;
        }

        // 2. Глобальная информация
        let routerIdMatch = trimmedLine.match(/^BGP Local router ID is (?<router_id>\S+)/i);
        if (routerIdMatch) {
            this.data.global_info.local_router_id = routerIdMatch.groups.router_id;
            return true;
        }

        let totalRoutesMatch = trimmedLine.match(/^Total number of routes from all PE: (?<total>\d+)/i);
        if (totalRoutesMatch) {
            this.data.global_info.total_routes_all_pe = parseInt(totalRoutesMatch.groups.total, 10);
            return true;
        }

        // 3. Новый Route Distinguisher (RD)
        let rdMatch = trimmedLine.match(/^Route Distinguisher: (?<rd>\S+)/i);
        if (rdMatch) {
            this.currentRD = {
                rd: rdMatch.groups.rd,
                routes: []
            };
            this.data.route_distinguishers.push(this.currentRD);
            this.lastPrimaryRoute = null;
            return true;
        }

        // 4. Парсинг маршрутов (только если мы внутри RD)
        if (!this.currentRD) {
            return true; // Ждем RD
        }

        // --- 🔥 ИСПРАВЛЕНИЕ: МЕНЯЕМ БЛОКИ МЕСТАМИ ---

        // 4a. Пытаемся распознать ВТОРИЧНЫЙ маршрут (без Network) ПЕРВЫМ
        let secondaryMatch = trimmedLine.match(REGEX_SECONDARY_ROUTE);
        if (secondaryMatch) {
            const path = this._createRouteObject(secondaryMatch.groups);

            if (this.lastPrimaryRoute) {
                if (!this.lastPrimaryRoute.secondary_paths) {
                    this.lastPrimaryRoute.secondary_paths = [];
                }
                this.lastPrimaryRoute.secondary_paths.push(path);
            } else {
                this.currentRD.routes.push(path);
            }
            return true;
        }

        // 4b. Пытаемся распознать ОСНОВНОЙ маршрут (с Network) ВТОРЫМ
        let primaryMatch = trimmedLine.match(REGEX_PRIMARY_ROUTE);
        if (primaryMatch) {
            const route = this._createRouteObject(primaryMatch.groups);
            this.currentRD.routes.push(route);
            this.lastPrimaryRoute = route; // Сохраняем как последний основной
            return true;
        }

        // ---------------------------------------------

        // Если ничего не совпало, передаем в BaseParser (он сообщит об ошибке)
        return super.parseLine(line);
    }

    // --- Вспомогательные методы ---

    _createRouteObject(groups) {
        return {
            status: groups.status,
            network: this._parseValue(groups.network),
            next_hop: groups.nexthop,
            med: this._parseValue(groups.med),
            loc_prf: this._parseValue(groups.locprf),
            pref_val: this._parseValue(groups.prefval),
            path_ogn: this._parseValue(groups.path)
        };
    }

    _parseValue(value) {
        if (value === undefined || value === null) {
            return null;
        }

        const trimmed = value.trim();

        if (trimmed === '') {
            return null;
        }

        if (trimmed.includes(' ') || trimmed.includes('?') || trimmed.includes('i') || trimmed.includes('e') || trimmed.includes('*')) {
            return trimmed;
        }

        const num = parseInt(trimmed, 10);
        return !isNaN(num) && String(num) === trimmed ? num : trimmed;
    }
}

// Экспортируем класс
module.exports = DisplayBgpVpnv4RoutingTableParser;