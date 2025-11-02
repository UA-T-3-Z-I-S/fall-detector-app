const { contextBridge, ipcRenderer } = require('electron');

const api = {
  readEngineConfig: () => ipcRenderer.invoke('read-engine-config'),
  readConfig: async () => {
    try {
      return await ipcRenderer.invoke('read-system-config');
    } catch (e) { return { ok: false, error: e?.message || String(e) }; }
  },
  validateLogin: async (username, password) => {
    try { return await ipcRenderer.invoke('validate-login', username, password); }
    catch (e) { return { ok: false, error: e?.message || String(e) }; }
  },
  openDashboard: () => ipcRenderer.send('open-dashboard'),
  logout: async () => ipcRenderer.invoke('logout'),
  checkEngine: () => ipcRenderer.invoke('check-engine-status'),
  startEngine: () => ipcRenderer.invoke('start-engine'),
  stopEngine: () => ipcRenderer.invoke('stop-engine'),
  onEngineEvent: (callback) => ipcRenderer.on('engine-event', (_e, data) => callback(data)),
  readUserConfig: () => ipcRenderer.invoke('read-user-config'),
  updateUserConfig: (username, password) =>
    ipcRenderer.invoke('update-user-config', { username, password }),
};

contextBridge.exposeInMainWorld('api', api);
