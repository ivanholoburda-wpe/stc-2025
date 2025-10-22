const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    runParsing: () => ipcRenderer.invoke('run-parsing'),
    getDevices: () => ipcRenderer.invoke('get-devices'),
    createDevice: (deviceData) => ipcRenderer.invoke('create-device', deviceData),
    getDeviceById: (id) => ipcRenderer.invoke('get-device-by-id', id),
    getAllSnapshots: () => ipcRenderer.invoke('get-snapshots'),
    analyzeSnapshot: (snapshotId, prompt) => ipcRenderer.invoke('analyze-snapshot', snapshotId, prompt),
    getTopology: () => ipcRenderer.invoke('get-topology'),
    getAvailableMetrics: () => ipcRenderer.invoke('get-available-metrics'),
    getTimeSeries: (metricId, deviceId, options) => ipcRenderer.invoke('get-time-series', metricId, deviceId, options),
    getAlarms: (snapshotId) => ipcRenderer.invoke('get-alarms', snapshotId),
    getDeviceDetailsForSummary: (deviceId, snapshotId) => ipcRenderer.invoke('get-details-for-summary', deviceId, snapshotId),
    getInterfacesForDevice: (deviceId, snapshotId) => ipcRenderer.invoke('get-interfaces-for-device', deviceId, snapshotId),
    getRoutingForDevice: (deviceId, snapshotId) => ipcRenderer.invoke('get-routing-for-device', deviceId, snapshotId),
    getProtocolsForDevice: (deviceId, snapshotId) => ipcRenderer.invoke('get-protocols-for-device', deviceId, snapshotId),
    getHardwareForDevice: (deviceId, snapshotId) => ipcRenderer.invoke('get-hardware-for-device', deviceId, snapshotId),
    getVpnForDevice: (deviceId, snapshotId) => ipcRenderer.invoke('get-vpn-for-device', deviceId, snapshotId),
});

contextBridge.exposeInMainWorld('configAPI', {
    isOfflineMode: () => ipcRenderer.invoke('config:is-offline'),
    getAiModelKey: () => ipcRenderer.invoke('config:get-ai-key'),
    getSettings: () => ipcRenderer.invoke('config:get-settings'),
    setNetworkMode: (isOffline) => ipcRenderer.invoke('config:set-network-mode', isOffline),
    setAiModelKey: (key) => ipcRenderer.invoke('config:set-ai-model-key', key),
    setAiPromptStart: (prompt) => ipcRenderer.invoke('config:set-ai-prompt-start', prompt),
});