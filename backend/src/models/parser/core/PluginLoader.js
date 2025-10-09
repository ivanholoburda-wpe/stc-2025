const fs = require('fs');
const path = require('path');

class PluginLoader {
  constructor() {
    this.pluginsPath = path.join(__dirname, '../plugins/parsers');
  }

  load() {
    const loadedPlugins = [];
    const pluginFiles = fs.readdirSync(this.pluginsPath).filter(file => file.endsWith('.js'));

    for (const file of pluginFiles) {
      const filePath = path.join(this.pluginsPath, file);
      try {
        const plugin = require(filePath);
        if (typeof plugin.isEntryPoint === 'function') {
          loadedPlugins.push(plugin);
          console.log(`🔌 Плагин "${file}" успешно загружен.`);
        }
      } catch (error) {
        console.error(`⚠️ Ошибка загрузки плагина "${file}":`, error);
      }
    }
    return loadedPlugins;
  }
}

module.exports = PluginLoader;