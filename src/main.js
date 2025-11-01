const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

// Handler para que el preload/renderer solicite la configuración
ipcMain.handle('read-system-config', async () => {
  try {
    const p = path.join(__dirname, 'system_local.json');
    if (!fs.existsSync(p)) return { ok: false, error: 'No existe system_local.json' };
    const raw = fs.readFileSync(p, 'utf8');
    const cfg = JSON.parse(raw);
    return { ok: true, config: { username: cfg.USER_LOGIN?.username ?? null } };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
});

// Handler para validar login en el proceso principal (tiene acceso a fs)
ipcMain.handle('validate-login', async (event, username, password) => {
  try {
    const p = path.join(__dirname, 'system_local.json');
    if (!fs.existsSync(p)) return { ok: false, error: 'No existe system_local.json' };
    const raw = fs.readFileSync(p, 'utf8');
    const cfg = JSON.parse(raw);
    const expectedUser = cfg.USER_LOGIN?.username ?? '';
    const expectedPass = Buffer.from(cfg.USER_LOGIN?.password ?? '', 'base64').toString('utf8');
    const success = username === expectedUser && password === expectedPass;
    return { ok: true, success };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
});

ipcMain.on('open-dashboard', () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile(path.join(__dirname, 'dashboard.html'));
    }
  } catch (e) {
    console.error('open-dashboard error:', e);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
