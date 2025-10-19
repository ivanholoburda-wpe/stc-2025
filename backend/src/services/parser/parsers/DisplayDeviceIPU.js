const BaseParser = require('../../../../../../Users/Professional/Desktop/stc-2025-parser/parser/core/BaseParser');

class DisplayIpuDetailParser extends BaseParser {
    constructor() {
        super();
        this.name = 'display_ipu_detail_block';

        
        this.currentPic = null;
        
        this.inStatisticsSection = false;
    }

    
    isEntryPoint(line) {
        
        const regex = /^IPU\s+(?<model>\S+)\s+(?<slot>\d+)'s detail information:/;
        return line.match(regex);
    }

    /**
     * Инициализация структуры данных
     */
    startBlock(line, match) {
        super.startBlock(line, match);
        this.data = {
            type: this.name,
            ipu_model: match.groups.model,
            slot: parseInt(match.groups.slot, 10),
            statistics: {}, // Отдельный объект для статистики
            pics: [],       // Массив для хранения данных о PIC-модулях
        };
        this.currentPic = null; // Сбрасываем состояние PIC
        this.inStatisticsSection = false; // Сбрасываем флаг статистики
    }

    /**
     * Используем parseLine из-за необходимости управлять состоянием (IPU vs PIC vs Statistics)
     */
    parseLine(line) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('---')) {
            return true; // Игнорируем пустые строки и разделители
        }

        // --- 1. ПРИОРИТЕТНАЯ ПРОВЕРКА НА СМЕНУ КОНТЕКСТА ---

        // Ищем заголовок нового PIC
        const picMatch = trimmedLine.match(/^PIC(?<num>\d+):\s*(?<model>.*?)\s+information:/);
        if (picMatch) {
            this.inStatisticsSection = false; // Выходим из секции статистики, если она была
            const newPic = {
                pic_number: parseInt(picMatch.groups.num, 10),
                model: picMatch.groups.model,
            };
            this.data.pics.push(newPic);
            this.currentPic = newPic; // Устанавливаем текущий PIC
            return true;
        }

        // Ищем начало блока статистики
        if (trimmedLine === 'Statistic information:') {
            this.inStatisticsSection = true;
            // Пропускаем следующую строку с заголовками таблицы статистики
            this.skipNextLine = true;
            return true;
        }
        // Пропускаем строку заголовка статистики, если флаг установлен
        if (this.skipNextLine) {
            this.skipNextLine = false;
            return true;
        }


        // --- 2. ОБРАБОТКА "КЛЮЧ : ЗНАЧЕНИЕ" ---
        const kvMatch = trimmedLine.match(/^\s*(?<key>.+?):\s*(?<value>.*)$/);
        if (kvMatch) {
            const { key, value } = kvMatch.groups;
            const normalizedKey = this._normalizeKey(key);
            const parsedValue = this._parseValue(value);

            // Определяем, куда записать: в статистику, в текущий PIC или в основной объект IPU
            let targetObject;
            if (this.inStatisticsSection) {
                targetObject = this.data.statistics;
            } else if (this.currentPic) {
                targetObject = this.currentPic;
            } else {
                targetObject = this.data;
            }

            targetObject[normalizedKey] = parsedValue;
            return true;
        }

        // Если строка не подошла ни под одно правило
        return false;
    }

    _normalizeKey(key) {
        return key
            .trim()
            .toLowerCase()
            .replace(/\(%?\)/g, '') // Удаляем (%) и ()
            .replace(/[^a-z0-9\s_]/g, '') // Удаляем все символы кроме букв, цифр, пробелов и _
            .trim()
            .replace(/\s+/g, '_');
    }

    _parseValue(value) {
        const trimmed = value.trim();
        if (trimmed === '') return null;

        // Проверка на проценты
        if (trimmed.endsWith('%')) {
            const num = parseInt(trimmed, 10);
            return isNaN(num) ? trimmed : num;
        }

        // Проверка на MB
        if (trimmed.includes('MB/')) {
            const parts = trimmed.split('MB/');
            const used = parseInt(parts[0], 10);
            const total = parseInt(parts[1], 10);
            return isNaN(used) || isNaN(total) ? trimmed : { used_mb: used, total_mb: total };
        }

        // Проверка на просто число
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && String(num) === trimmed) { // Убедимся, что вся строка - это число
            return num;
        }

        return trimmed; // Возвращаем как строку, если ничего не подошло
    }
}

module.exports = DisplayIpuDetailParser;