const BaseParser = require('../core/BaseParser');

/**
 * Парсер для вывода команды 'display bgp vpnv6 all routing-table'.
 * * Собирает глобальную информацию (Router ID, Total routes)
 * и группирует маршруты по их Route Distinguisher (RD).
 * Корректно обрабатывает многострочные записи для каждого маршрута.
 */
class DisplayBgpVpnv6RoutingTableParser extends BaseParser {

    constructor() {
        super();
        this.name = 'display_bgp_vpnv6_routing_table_block';
        this.currentRD = null; // Текущий блок Route Distinguisher
        this.currentRoute = null; // Текущий (многострочный) маршрут в процессе парсинга
    }

    isEntryPoint(line) {
        return line.includes('display bgp vpnv6 all routing-table');
    }

    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            ...this.data, // Наследуем type, parsed_at и т.д. из BaseParser
            global_info: {},
            route_distinguishers: []
        };
        this.currentRD = null;
        this.currentRoute = null;
    }

    isBlockComplete(line) {
        const trimmedLine = line.trim();
        // Не завершаем блок на пустых строках, так как они есть в выводе
        if (!trimmedLine) {
            return false;
        }
        return super.isBlockComplete(line);
    }

    parseLine(line) {
        const trimmedLine = line.trim();

        // Пропускаем пустые строки и заголовки, которые нам не нужны
        if (!trimmedLine ||
            trimmedLine.startsWith('Status codes:') ||
            trimmedLine.startsWith('RPKI validation codes:')) {
            return true;
        }

        // --- 1. Глобальная информация ---

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

        // --- 2. Новый Route Distinguisher (RD) ---

        let rdMatch = trimmedLine.match(/^Route Distinguisher: (?<rd>\S+)/i);
        if (rdMatch) {
            this.currentRD = {
                rd: rdMatch.groups.rd,
                routes: []
            };
            this.data.route_distinguishers.push(this.currentRD);
            this.currentRoute = null; // Сбрасываем текущий маршрут
            return true;
        }

        // --- 3. Парсинг маршрутов (многострочный) ---

        // Если мы не в RD, то маршруты парсить некуда
        if (!this.currentRD) {
            return true; // Ждем RD
        }

        // 3a. Начало нового маршрута (Line 1: Status, Network, PrefixLen)
        // Пример: *>     Network  : ****::**** PrefixLen : 64
        let routeStartMatch = trimmedLine.match(/^(?<status>\S+)\s+Network\s*:\s*(?<network>\S+)\s+PrefixLen\s*:\s*(?<prefix_len>\d+)/);
        if (routeStartMatch) {
            this.currentRoute = {
                status: routeStartMatch.groups.status,
                network: routeStartMatch.groups.network,
                prefix_len: parseInt(routeStartMatch.groups.prefix_len, 10),
            };
            this.currentRD.routes.push(this.currentRoute);
            return true;
        }

        // Если мы не начали новый маршрут, проверяем, продолжаем ли мы старый
        if (!this.currentRoute) {
            // Мы находимся между маршрутами (например, на пустой строке, которую уже отфильтровали)
            return true;
        }

        // 3b. (Line 2: NextHop, LocPrf)
        // Пример: NextHop  : ****::**** LocPrf    :
        let nextHopMatch = trimmedLine.match(/^NextHop\s*:\s*(?<nexthop>\S+)\s+LocPrf\s*:\s*(?<locprf>.*)/i);
        if (nextHopMatch) {
            this.currentRoute.next_hop = nextHopMatch.groups.nexthop;
            this.currentRoute.loc_prf = this._parseValue(nextHopMatch.groups.locprf);
            return true;
        }

        // 3c. (Line 3: MED, PrefVal)
        // Пример: MED      :                                          PrefVal   : 0
        let medMatch = trimmedLine.match(/^MED\s*:\s*(?<med>.*)\s+PrefVal\s*:\s*(?<prefval>.*)/i);
        if (medMatch) {
            this.currentRoute.med = this._parseValue(medMatch.groups.med);
            this.currentRoute.pref_val = this._parseValue(medMatch.groups.prefval);
            return true;
        }

        // 3d. (Line 4: Label)
        // Пример: Label    :
        let labelMatch = trimmedLine.match(/^Label\s*:\s*(?<label>.*)/i);
        if (labelMatch) {
            this.currentRoute.label = this._parseValue(labelMatch.groups.label);
            return true;
        }

        // 3e. (Line 5: Path/Ogn) - Это последняя строка маршрута
        // Пример: Path/Ogn : ***** *****?
        let pathMatch = trimmedLine.match(/^Path\/Ogn\s*:\s*(?<path>.*)/i);
        if (pathMatch) {
            this.currentRoute.path_ogn = this._parseValue(pathMatch.groups.path);

            // Завершаем парсинг этого маршрута, сбрасывая currentRoute
            this.currentRoute = null;
            return true;
        }

        // Если мы дошли сюда, строка не распознана
        return super.parseLine(line);
    }

    // --- Вспомогательные методы ---

    /**
     * Умный парсер для значений, которые могут быть числами,
     * строками ('?', '***** *****i') или пустыми (null).
     */
    _parseValue(value) {
        const trimmed = value.trim();

        // Если строка пустая, возвращаем null
        if (trimmed === '') {
            return null;
        }

        // Если это строка, которая не должна быть числом
        if (trimmed.includes(' ') || trimmed.includes('?') || trimmed.includes('i') || trimmed.includes('e')) {
            return trimmed;
        }

        // Пробуем преобразовать в число
        const num = parseInt(trimmed, 10);
        return !isNaN(num) && String(num) === trimmed ? num : trimmed;
    }
}

// Экспортируем класс
module.exports = DisplayBgpVpnv6RoutingTableParser;