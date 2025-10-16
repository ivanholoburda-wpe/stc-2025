const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runParsing: () => ipcRenderer.invoke('run-parsing'),
  getDevices: () => ipcRenderer.invoke('get-devices'),
  createDevice: (deviceData) => ipcRenderer.invoke('create-device', deviceData),
  getDeviceById: (id) => ipcRenderer.invoke('get-device-by-id', id),
});

contextBridge.exposeInMainWorld('configAPI', {
  isOfflineMode: () => ipcRenderer.invoke('config:is-offline-mode'),
})
