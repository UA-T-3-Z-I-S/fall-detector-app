const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

global.APP_ROOT = __dirname;

const { setupIpcHandlers } = require('./main/IpcHandlers');
const { stopEngineSilently } = require('./main/EngineController');

let mainWindow;
let cameraServerProcess;

function startCameraServer() {
  const serverPath = path.join(global.APP_ROOT, 'server/camera_server.js');

  cameraServerProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    cwd: global.APP_ROOT
  });

  cameraServerProcess.on('close', (code) => {
    console.log(`Camera server cerrado con código ${code}`);
  });

  cameraServerProcess.on('error', (err) => {
    console.error('Error iniciando camera server:', err);
  });
}

function createWindow() {
  startCameraServer(); // ⬅ arrancamos el servidor de la cámara antes de crear la ventana

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(global.APP_ROOT, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  setupIpcHandlers(mainWindow);

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

app.on('will-quit', () => {
  stopEngineSilently();
  // 🔹 cerrar camera server si está corriendo
  if (cameraServerProcess) cameraServerProcess.kill('SIGINT');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

module.exports.getMainWindow = () => mainWindow;
