const { contextBridge, ipcRenderer } = require('electron');

const api = {
  // --- Config y login ---
  readEngineConfig: () => ipcRenderer.invoke('read-engine-config'),
  readConfig: async () => {
    try {
      return await ipcRenderer.invoke('read-system-config');
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },
  validateLogin: async (username, password) => {
    try {
      return await ipcRenderer.invoke('validate-login', username, password);
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },
  openDashboard: () => ipcRenderer.send('open-dashboard'),
  logout: () => ipcRenderer.invoke('logout'),

  // --- Motor ---
  checkEngine: () => ipcRenderer.invoke('check-engine-status'),
  startEngine: () => ipcRenderer.invoke('start-engine'),
  stopEngine: () => ipcRenderer.invoke('stop-engine'),
  onEngineEvent: (callback) => ipcRenderer.on('engine-event', (_e, data) => callback(data)),

  // --- Usuario ---
  readUserConfig: () => ipcRenderer.invoke('read-user-config'),
  updateUserConfig: (username, password) =>
    ipcRenderer.invoke('update-user-config', { username, password }),

  // --- MongoDB vía main ---
  queryMongo: (collection, query = {}) =>
    ipcRenderer.invoke('mongo-query', { collection, query }),
  insertMongo: (collection, doc) =>
    ipcRenderer.invoke('mongo-insert', { collection, doc }),

  // --- UUID v4 puro JS ---
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

// Exponer en el contexto seguro del renderer
contextBridge.exposeInMainWorld('api', api);
