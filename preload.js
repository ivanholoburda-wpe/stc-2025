const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    runParsing: () => ipcRenderer.invoke('run-parsing'),
    getDevices: () => ipcRenderer.invoke('get-devices'),
    createDevice: (deviceData) => ipcRenderer.invoke('create-device', deviceData),
    getDeviceById: (id) => ipcRenderer.invoke('get-device-by-id', id),
    getAllSnapshots: () => ipcRenderer.invoke('get-snapshots'),
    analyzeSnapshot: (snapshotId, prompt) => ipcRenderer.invoke('analyze-snapshot', snapshotId, prompt),
    getTopology: () => ipcRenderer.invoke('get-topology'),
});

contextBridge.exposeInMainWorld('configAPI', {
    isOfflineMode: () => ipcRenderer.invoke('config:is-offline-mode'),
})
