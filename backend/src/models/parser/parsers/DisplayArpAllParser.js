const BaseParser = require('../core/BaseParser');

class DisplayArpAllParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_arp_all_block';
    
    // Храним ссылку на последнюю разобранную ARP-запись для добавления VLAN
    this.lastArpEntry = null;
  }

  isEntryPoint(line) {
    // Надежная точка входа, которая не зависит от форматирования
    return line.includes('IP ADDRESS') && line.includes('MAC ADDRESS') && line.includes('EXPIRE(M)');
  }

  startBlock(line, match) {
    super.startBlock(line, match);
    this.data = {
      type: this.name,
      summary: {}, // Добавляем объект для итоговой статистики
      entries: [],
    };
    this.lastArpEntry = null;
  }

  /**
   * Мы не используем массив `rules`, а обрабатываем все в `parseLine`,
   * так как в логе есть разные по структуре секции (данные, vlan, сводка).
   */
  parseLine(line) {
    const trimmedLine = line.trim();

    // --- Сначала отсекаем всё, что точно не является данными ---
    if (!trimmedLine || trimmedLine.startsWith('---') || trimmedLine.startsWith('IP ADDRESS') || trimmedLine.startsWith('VLAN/CEVLAN')) {
      return true;
    }

    // --- 1. ПРОВЕРЯЕМ, НЕ ЯВЛЯЕТСЯ ЛИ СТРОКА ВТОРОЙ СТРОКОЙ С VLAN ---
    // (уникальный формат с большим отступом)
    const vlanMatch = trimmedLine.match(/^(?<vlan>\d+)\/(?<cevlan>\S+)$/);
    if (vlanMatch) {
      if (this.lastArpEntry) {
        this.lastArpEntry.vlan = parseInt(vlanMatch.groups.vlan, 10);
        this.lastArpEntry.cevlan = vlanMatch.groups.cevlan;
      }
      return true;
    }

    // --- 2. ПРОВЕРЯЕМ, НЕ ЯВЛЯЕТСЯ ЛИ СТРОКА СВОДКОЙ "Total:..." ---
    const summaryMatch = trimmedLine.match(/^Total:(?<total>\d+)/);
    if (summaryMatch) {
      // Это правило может быть расширено для захвата всех полей, если нужно
      this.data.summary.total = parseInt(summaryMatch.groups.total, 10);
      return true;
    }
    if (trimmedLine.startsWith('Redirect:')) { // Игнорируем вторую строку сводки
        return true;
    }

    // --- 3. ЕСЛИ ЭТО НЕ VLAN И НЕ СВОДКА, ЗНАЧИТ, ЭТО ОСНОВНАЯ ARP-ЗАПИСЬ ---
    // Используем программный разбор - он самый надежный
    const parts = trimmedLine.split(/\s+/);
    if (parts.length < 3) { // У валидной строки минимум 3 части: IP, MAC, Type/Interface
      return false; // Это мусорная строка, пусть будет warning
    }

    // Проверяем, что первая часть похожа на IP, чтобы не парсить мусор
    if (!/^\d{1,3}\./.test(parts[0])) {
        return false;
    }

    const newEntry = {
      ip_address: parts.shift(),
      mac_address: parts.shift(),
      expire_m: null,
      type: null,
      interface: null,
      vpn_instance: null,
      vlan: null,
      cevlan: null
    };
    
    // Теперь 'parts' содержит [expire], type, interface, [vpn]
    
    // Проверяем, есть ли поле Expire(M)
    if (!isNaN(parseInt(parts[0], 10))) {
      newEntry.expire_m = parseInt(parts.shift(), 10);
    }
    
    // Забираем поле Type
    let type = parts.shift();
    if (parts[0] === '-') { // Особый случай для типа 'I -'
      type += ` ${parts.shift()}`;
    }
    newEntry.type = type;

    // Забираем Интерфейс
    newEntry.interface = parts.shift();

    // Всё, что осталось в массиве - это VPN-INSTANCE
    if (parts.length > 0) {
      newEntry.vpn_instance = parts.join(' ');
    }

    this.data.entries.push(newEntry);
    this.lastArpEntry = newEntry; // Запоминаем эту запись
    return true;
  }
}

module.exports = DisplayArpAllParser;