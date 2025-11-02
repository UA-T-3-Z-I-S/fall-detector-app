const { contextBridge, ipcRenderer } = require('electron');

const api = {
  readConfig: async () => {
    try {
      const res = await ipcRenderer.invoke('read-system-config');
      return res;
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },

  validateLogin: async (username, password) => {
    try {
      const res = await ipcRenderer.invoke('validate-login', username, password);
      return res;
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },

  openDashboard: () => {
    try {
      ipcRenderer.send('open-dashboard');
    } catch (e) {
      console.error('preload openDashboard error:', e);
    }
  },

  logout: async () => {
    try {
      await ipcRenderer.invoke('logout');
    } catch (e) {
      console.error('logout error:', e);
    }
  },

  checkEngine: () => ipcRenderer.invoke('check-engine-status'),

  startEngine: () => ipcRenderer.invoke('start-engine'),

  stopEngine: () => ipcRenderer.invoke('stop-engine'),

  // 🧠 Escuchar eventos del motor IA (modelo, cámara, errores, etc.)
  onEngineEvent: (callback) => ipcRenderer.on('engine-event', (_event, data) => callback(data)),
};

try {
  contextBridge.exposeInMainWorld('api', api);
  console.log('Preload: API expuesta en window.api');
} catch (e) {
  console.error('Preload exposición error:', e);
  globalThis.api = api;
}
