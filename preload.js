const { contextBridge, ipcRenderer } = require('electron');

const validChannels = [
  'read-file',
  'get-devices',
  'get-device-by-id',
  'create-device',
];

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: () => ipcRenderer.invoke('read-file'),
  getDevices: () => ipcRenderer.invoke('get-devices'),
  createDevice: (deviceData) => ipcRenderer.invoke('create-device', deviceData),
  getDeviceById: (id) => ipcRenderer.invoke('get-device-by-id', id),
});
