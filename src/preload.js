const { contextBridge, ipcRenderer } = require('electron');

const api = {
  readConfig: async () => {
    try {
      const res = await ipcRenderer.invoke('read-system-config');
      return res;
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  },

  validateLogin: async (username, password) => {
    try {
      const res = await ipcRenderer.invoke('validate-login', username, password);
      return res;
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  },

  openDashboard: () => {
    try {
      ipcRenderer.send('open-dashboard');
    } catch (e) {
      console.error('preload openDashboard error:', e);
    }
  }
};

try {
  if (contextBridge && contextBridge.exposeInMainWorld) {
    contextBridge.exposeInMainWorld('api', api);
    console.log('Preload: API expuesta en window.api');
  } else {
    globalThis.api = api;
    console.warn('Preload: contextBridge no disponible, expuesto en globalThis.api');
  }
} catch (e) {
  console.error('Preload exposición error:', e);
  try { globalThis.api = api; } catch {}
}
