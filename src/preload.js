const { contextBridge, ipcRenderer } = require('electron');

const api = {
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

  checkEngine: () => ipcRenderer.invoke('check-engine-status'),
  startEngine: () => ipcRenderer.invoke('start-engine'),
  stopEngine: () => ipcRenderer.invoke('stop-engine'),
  onEngineEvent: (callback) => ipcRenderer.on('engine-event', (_e, data) => callback(data)),

  sendNotification: (notif) => {
    ipcRenderer.send('notificacion-en-panel', notif); // canal específico
  },

  onNotification: (callback) => {
    ipcRenderer.on('notificacion-en-panel', (_e, data) => callback(data));
  },

  readUserConfig: () => ipcRenderer.invoke('read-user-config'),
  updateUserConfig: (username, password) =>
    ipcRenderer.invoke('update-user-config', { username, password }),

  queryMongo: (collection, query = {}) =>
    ipcRenderer.invoke('mongo-query', { collection, query }),
  insertMongo: (collection, doc) =>
    ipcRenderer.invoke('mongo-insert', { collection, doc }),
  updateMongo: (collection, id, data) =>
    ipcRenderer.invoke('mongo-update', { collection, id, data }),

  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

contextBridge.exposeInMainWorld('api', api);
