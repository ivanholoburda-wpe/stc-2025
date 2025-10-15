const BaseParser = require('../core/BaseParser'); // Предполагаем, что у тебя есть такой базовый класс

class DisplayAlarmAllParser extends BaseParser {
  constructor() {
    super();
    this.name = 'display_alarm_all_block';
    // Временное хранилище для текущего собираемого алерта
    this.currentAlarm = null;
  }

  /**
   * Определяет, что этот парсер должен обработать блок, найдя заголовок.
   */
  isEntryPoint(line) {
    return /^Index\s+Level\s+Date\s+Time\s+Info/.test(line);
  }

  /**
   * Инициализация при входе в блок.
   */
  startBlock(line) {
    super.startBlock(line);
    // Создаем массив для хранения результатов
    this.data = {
      ...this.data,
      alarms: [],
    };
    // Сбрасываем временный объект
    this.currentAlarm = null;
  }

  /**
   * Основная логика обработки каждой строки.
   */
  parseLine(line) {
    // Регулярное выражение для поиска НАЧАЛА нового алерта
    const alarmStartRegex = /^\s*(?<Index>\d+)\s+(?<Level>\S+)\s+(?<Date>\d{4}-\d{2}-\d{2})\s+(?<Time>[\d:.]+\+\d{2}:\d{2}(?:\s+DST)?)\s+(?<Info>.*)$/;
    const match = line.match(alarmStartRegex);

    if (match) {
      // НАЙДЕНО НАЧАЛО НОВОГО АЛЕРТА
      
      // 1. Сохраняем предыдущий алерт, если он был в процессе сборки
      this._commitCurrentAlarm();

      // 2. Начинаем собирать новый алерт из текущей строки
      this.currentAlarm = {
        index: parseInt(match.groups.Index, 10),
        level: match.groups.Level,
        date: match.groups.Date,
        time: match.groups.Time.replace(/\s+DST$/, ''), // Убираем DST для чистоты
        info: match.groups.Info.trim(),
      };

    } else if (this.currentAlarm && line.trim()) {
      // ЭТО СТРОКА-ПРОДОЛЖЕНИЕ
      // Если строка не является началом нового алерта, но есть текущий алерт в сборке
      // и строка не пустая, то добавляем ее текст к `info`.
      this.currentAlarm.info += ' ' + line.trim();
    }
    // Игнорируем пустые строки, разделители и заголовки - для них ничего не делаем

    return true; // Сообщаем, что строка обработана (даже если проигнорирована)
  }

  /**
   * Вызывается, когда парсинг блока завершен.
   */
  endBlock() {
    // Важно! Сохраняем самый последний алерт, который был в обработке.
    this._commitCurrentAlarm();
    super.endBlock();
  }

  /**
   * Внутренний метод для сохранения собранного алерта в результат.
   */
  _commitCurrentAlarm() {
    if (this.currentAlarm) {
      // Очищаем `info` от лишних пробелов, которые могли появиться при склейке
      this.currentAlarm.info = this.currentAlarm.info.replace(/\s+/g, ' ').trim();

      // Теперь, когда info полное, извлекаем OID и EntCode
      const oidMatch = this.currentAlarm.info.match(/ID:([\d.]+)/);
      const entCodeMatch = this.currentAlarm.info.match(/Code:(\d+)/);

      this.currentAlarm.oid = oidMatch ? oidMatch[1] : null;
      this.currentAlarm.ent_code = entCodeMatch ? parseInt(entCodeMatch[1], 10) : null;
      
      // Добавляем готовый объект в массив результатов
      this.data.alarms.push(this.currentAlarm);
      
      // Сбрасываем временный объект
      this.currentAlarm = null;
    }
  }
}

module.exports = DisplayAlarmAllParser;