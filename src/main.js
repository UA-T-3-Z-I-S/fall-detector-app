const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');

let mainWindow;
let engineProcess = null; // 🧠 referencia al proceso .exe

// ============================================================
// 🪟 CREACIÓN DE VENTANA PRINCIPAL
// ============================================================
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

  const cfgPath = path.join(__dirname, 'system_local.json');
  try {
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const cfg = JSON.parse(raw);
    // ✅ Si ya hay sesión activa, cargar el dashboard directamente
    if (cfg.USER_SESSION?.active) {
      mainWindow.loadFile(path.join(__dirname, 'dashboard.html'));
    } else {
      mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }
  } catch (err) {
    console.error('Error leyendo config:', err);
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }
}

app.whenReady().then(createWindow);

// ============================================================
// ⚙️ FUNCIONES COMUNES
// ============================================================

// Leer configuración básica
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

// Validar login + guardar sesión activa
ipcMain.handle('validate-login', async (event, username, password) => {
  try {
    const p = path.join(__dirname, 'system_local.json');
    if (!fs.existsSync(p)) return { ok: false, error: 'No existe system_local.json' };
    const raw = fs.readFileSync(p, 'utf8');
    const cfg = JSON.parse(raw);
    const expectedUser = cfg.USER_LOGIN?.username ?? '';
    const expectedPass = Buffer.from(cfg.USER_LOGIN?.password ?? '', 'base64').toString('utf8');
    const success = username === expectedUser && password === expectedPass;

    if (success) {
      cfg.USER_SESSION.active = true;
      cfg.USER_SESSION.last_login = new Date().toISOString();
      fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
    }

    return { ok: true, success };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
});

// Logout → desactiva sesión
ipcMain.handle('logout', async () => {
  try {
    const p = path.join(__dirname, 'system_local.json');
    if (!fs.existsSync(p)) return false;
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
    cfg.USER_SESSION.active = false;
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }
    return true;
  } catch (e) {
    console.error('Error al cerrar sesión:', e);
    return false;
  }
});

// Abrir dashboard
ipcMain.on('open-dashboard', () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile(path.join(__dirname, 'dashboard.html'));
    }
  } catch (e) {
    console.error('open-dashboard error:', e);
  }
});

// ============================================================
// 🧠 CONTROL DEL MOTOR IA
// ============================================================

// 🧹 Detener motor de forma segura
function stopEngineSilently() {
  try {
    if (engineProcess) {
      try {
        process.kill(-engineProcess.pid);
      } catch {
        engineProcess.kill();
      }
      console.log('Motor detenido (silenciosamente)');
      engineProcess = null;
    }
  } catch (err) {
    console.error('Error al detener motor (silencioso):', err);
  }
}

// 🚀 Iniciar el motor IA
ipcMain.handle('start-engine', async () => {
  try {
    if (engineProcess) {
      return { ok: false, message: 'El motor ya está en ejecución' };
    }

    const engineDir = path.join(__dirname, 'engine');
    const exePath = path.join(engineDir, 'fall_detector.exe');
    if (!fs.existsSync(exePath)) {
      return { ok: false, message: 'No se encontró el ejecutable del motor' };
    }

    // 🌐 Entorno heredado y configuración de OpenCV/TF
    const env = {
      ...process.env,
      OPENCV_FFMPEG_CAPTURE_OPTIONS: 'rtsp_transport;tcp|stimeout;3000000',
      PYTHONUNBUFFERED: '1',
    };

    const engineDirAbs = path.resolve(engineDir);

    engineProcess = spawn(exePath, [], {
      cwd: engineDirAbs,
      shell: false,
      detached: true,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    });

    console.log('Motor iniciado en directorio:', engineDirAbs);
    console.log('Motor iniciado:', exePath);

    // 🔍 Procesar la salida (stdout/stderr)
    const handleEngineOutput = (chunk, source = 'stdout') => {
      const text = chunk.toString().trim();
      for (const rawLine of text.split('\n')) {
        const line = rawLine.replace(/[^\x20-\x7E{}[\]":,._-]/g, '').trim();
        try {
          const msg = JSON.parse(line);

          // 📡 Log completo de cada mensaje JSON
          console.log('📡 Mensaje del motor:', msg);

          // 📷 Confirmar cámara conectada
          if (msg.evento === 'camara_activa') {
            console.log(`📷 Cámara activa detectada: ${msg.camara} (${msg.rtsp})`);
          }

          if (msg.evento && mainWindow) {
            mainWindow.webContents.send('engine-event', msg);

            // 🚨 Si hay error RTSP, detener automáticamente
            if (msg.evento === 'advertencia' && msg.mensaje?.includes('No se pudo abrir RTSP')) {
              console.warn('🚨 Advertencia RTSP detectada, deteniendo motor...');
              stopEngineSilently();
              mainWindow.webContents.send('engine-event', { evento: 'motor_apagado_rtsp' });
            }
          }
        } catch {
          console.log(`Motor ${source} no JSON:`, line);
        }
      }
    };

    engineProcess.stdout.on('data', (data) => handleEngineOutput(data, 'stdout'));
    engineProcess.stderr.on('data', (data) => handleEngineOutput(data, 'stderr'));

    engineProcess.on('exit', (code, signal) => {
      console.warn(`⚠️ Motor finalizó (código ${code}, señal ${signal})`);
      engineProcess = null;
      if (mainWindow) {
        mainWindow.webContents.send('engine-event', { evento: 'motor_finalizado' });
      }
    });

    return { ok: true };
  } catch (err) {
    console.error('Error al iniciar motor:', err);
    return { ok: false, message: err.message };
  }
});

// ✋ Detener motor manualmente
ipcMain.handle('stop-engine', async () => {
  try {
    stopEngineSilently();
    return { ok: true };
  } catch (err) {
    console.error('Error al detener motor:', err);
    return { ok: false, message: err.message };
  }
});

// 🩺 Verificar si el motor está corriendo
ipcMain.handle('check-engine-status', async () => {
  return new Promise((resolve) => {
    exec('tasklist', (err, stdout) => {
      if (err) return resolve({ ok: false, running: false });
      const isRunning = stdout.toLowerCase().includes('fall_detector.exe');
      resolve({ ok: true, running: isRunning });
    });
  });
});

// Cerrar app si se cierran todas las ventanas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
