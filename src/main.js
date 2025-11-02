// fall-detector-app/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// ============================================================
// 🔑 PASO CLAVE: ESTABLECER RUTA GLOBAL (Debe ser lo primero)
// ============================================================
global.APP_ROOT = __dirname;

// 💡 Importamos los módulos clave que dependen de global.APP_ROOT
const { setupIpcHandlers } = require('./main/IpcHandlers');
const { stopEngineSilently } = require('./main/EngineController');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(global.APP_ROOT, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 💡 Registrar todos los ipcMain.handle/on
  setupIpcHandlers(mainWindow);

  // Lógica de sesión (usando path.join con APP_ROOT para consistencia)
  const cfgPath = path.join(global.APP_ROOT, 'system_local.json');
  try {
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const cfg = JSON.parse(raw);
    if (cfg.USER_SESSION?.active) {
      mainWindow.loadFile(path.join(global.APP_ROOT, 'dashboard.html'));
    } else {
      mainWindow.loadFile(path.join(global.APP_ROOT, 'index.html'));
    }
  } catch (err) {
    console.error('Error leyendo config:', err);
    mainWindow.loadFile(path.join(global.APP_ROOT, 'index.html'));
  }
}

app.whenReady().then(createWindow);

// Detener el motor externo cuando la aplicación va a cerrarse
app.on('will-quit', () => {
  stopEngineSilently();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Exportar mainWindow para que otros módulos lo puedan usar si es necesario
module.exports.getMainWindow = () => mainWindow;
