// ==========================================================
// 🧠 CARGAR TOPBAR Y CONTROLAR MOTOR
// ==========================================================
fetch('./ui/components/topbar.html')
  .then((res) => res.text())
  .then(async (html) => {
    document.getElementById('topbar-container').innerHTML = html;

    const logoutBtn = document.getElementById('logout-btn');
    const engineToggle = document.getElementById('engine-toggle');
    const switchEl = document.querySelector('.slider');
    const label = document.getElementById('engine-label');
    const openConfigBtn = document.getElementById('open-config-btn');

    // 🔹 Función visual del switch
    const setState = (state, text) => {
      label.textContent = text;
      switch (state) {
        case 'off':
          switchEl.style.backgroundColor = '#e74c3c'; // rojo
          break;
        case 'starting':
          switchEl.style.backgroundColor = '#FFD54A'; // amarillo
          break;
        case 'on':
          switchEl.style.backgroundColor = '#4CAF50'; // verde
          break;
      }
    };

    // 🔸 Logout
    logoutBtn.addEventListener('click', async () => {
      await window.api.logout();
    });

    // 🔸 Estado del motor al iniciar
    const status = await window.api.checkEngine();
    if (status.ok && status.running) {
      engineToggle.checked = true;
      setState('on', 'Motor operativo');
    } else {
      setState('off', 'Motor apagado');
    }

    // 🔸 Escuchar eventos del motor
    window.api.onEngineEvent((msg) => {
      console.log('Evento motor:', msg);
      if (msg.evento === 'modelo_iniciando') {
        setState('starting', 'Cargando modelo...');
      } else if (msg.evento === 'modelo_listo') {
        setState('starting', 'Esperando cámara...');
      } else if (msg.evento === 'camara_activa') {
        setState('on', 'Motor operativo');
      } else if (msg.evento === 'advertencia' && msg.mensaje?.includes('No se pudo abrir RTSP')) {
        alert('⚠️ No se pudo abrir la cámara RTSP. El motor se apagó automáticamente.');
        setState('off', 'Motor apagado');
        engineToggle.checked = false;
      } else if (msg.evento === 'motor_finalizado' || msg.evento === 'error') {
        setState('off', 'Motor detenido');
        engineToggle.checked = false;
      }
    });

    // 🔸 Encendido / apagado manual
    engineToggle.addEventListener('change', async () => {
      if (engineToggle.checked) {
        setState('starting', 'Iniciando motor...');
        const result = await window.api.startEngine();
        if (!result.ok) {
          alert('Error al iniciar motor IA: ' + (result.message || 'desconocido'));
          setState('off', 'Motor apagado');
          engineToggle.checked = false;
        }
      } else {
        setState('starting', 'Deteniendo...');
        const result = await window.api.stopEngine();
        if (!result.ok) {
          alert('Error al detener motor IA: ' + (result.message || 'desconocido'));
          setState('on', 'Motor operativo');
          engineToggle.checked = true;
        } else {
          setState('off', 'Motor apagado');
        }
      }
    });

    // ==========================================================
    // ⚙️ CONFIGURACIÓN DE USUARIO (Modal)
    // ==========================================================
    const modal = document.getElementById('config-modal');
    const closeBtn = document.getElementById('close-config');
    const saveBtn = document.getElementById('save-config');
    const userInput = document.getElementById('cfg-username');
    const passInput = document.getElementById('cfg-password');
    const togglePassBtn = document.getElementById('toggle-pass');

    openConfigBtn.addEventListener('click', async () => {
      const res = await window.api.readUserConfig();
      if (res.ok) {
        userInput.value = res.config.username || '';
        passInput.value = ''; // no mostrar contraseña actual
      } else {
        console.error('Error leyendo usuario:', res.error);
      }
      modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    // 👁️ Mostrar / ocultar contraseña
    togglePassBtn.addEventListener('click', () => {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePassBtn.textContent = '🙈';
      } else {
        passInput.type = 'password';
        togglePassBtn.textContent = '👁️';
      }
    });

    // 💾 Guardar cambios
    saveBtn.addEventListener('click', async () => {
      const username = userInput.value.trim();
      const password = passInput.value.trim();

      if (!username && !password) {
        alert('Debes ingresar al menos un campo para cambiar.');
        return;
      }

      const res = await window.api.updateUserConfig(username, password);
      if (!res.ok) {
        alert('Error guardando cambios: ' + res.error);
        return;
      }

      alert('✅ Usuario actualizado correctamente. Se cerrará la sesión.');
      modal.classList.add('hidden');

      // 🔐 Cerrar sesión automáticamente
      setTimeout(async () => {
        await window.api.logout();
      }, 500);
    });

    // ==========================================================
    // 📹 CARGAR COMPONENTE DE CÁMARA
    // ==========================================================
    async function loadCameraPanel() {
      try {
        const res = await fetch('./ui/components/camera_panel.html');
        const html = await res.text();
        document.getElementById('camera-container').innerHTML = html;

        // Referencias a elementos
        const placeholder = document.getElementById('cam-placeholder');
        const videoEl = document.getElementById('cam1');
        const labelEl = document.querySelector('.camera-label');

        // 🔹 Leer datos desde config_local.json del engine
        const engineCfg = await window.api.readEngineConfig();
        if (engineCfg.ok) {
          labelEl.textContent = engineCfg.config.camera_name || 'Cámara sin nombre';
          console.log('🎛️ Config cámara cargada:', engineCfg.config);
        } else {
          labelEl.textContent = 'Cámara desconocida';
          console.warn('No se pudo leer config_local.json:', engineCfg.error);
        }

        // 🖼️ Mostrar placeholder hasta que la cámara esté activa
        window.api.onEngineEvent((msg) => {
          if (msg.evento === 'camara_activa') {
            placeholder.style.display = 'none';
            videoEl.style.display = 'block';
            console.log('🎥 Cámara activa: mostrando video');
          } else if (msg.evento === 'motor_finalizado' || msg.evento === 'advertencia') {
            videoEl.style.display = 'none';
            placeholder.style.display = 'block';
          }
        });
      } catch (err) {
        console.error('Error cargando camera-panel:', err);
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      loadCameraPanel();
    });

});const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const Stream = require('node-rtsp-stream');

let mainWindow;
let engineProcess = null; // referencia al motor IA

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
    if (cfg.USER_SESSION?.active) {
      mainWindow.loadFile(path.join(__dirname, 'dashboard.html'));
    } else {
      mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }
  } catch (err) {
    console.error('Error leyendo config:', err);
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  // ============================================================
  // 🎥 INICIAR STREAM RTSP POR WEBSOCKET
  // ============================================================
  const configPath = path.join(__dirname, 'engine', 'config_local.json');
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      const cfg = JSON.parse(raw);
      const cameraUrl = cfg.LIVE_CAMERA_URL;
      const cameraName = cfg.CAMERA_NAME || 'Cámara';

      if (cameraUrl) {
        const stream = new Stream({
          name: cameraName,
          streamUrl: cameraUrl,
          wsPort: 9999,
          ffmpegOptions: {
            '-stats': '',
            '-r': 25,
          },
        });
        console.log(`🎥 Stream RTSP iniciado: ${cameraName} -> ${cameraUrl} (ws://localhost:9999)`);
      }
    } catch (err) {
      console.error('❌ Error leyendo config_local.json para RTSP:', err);
    }
  }
}

app.whenReady().then(createWindow);

// ============================================================
// 🔹 IPC HANDLERS
// ============================================================

// Leer configuración del sistema
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

// Validar login
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

// Logout
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

// Leer config_local.json
ipcMain.handle('read-engine-config', async () => {
  try {
    const configPath = path.join(__dirname, 'engine', 'config_local.json');
    if (!fs.existsSync(configPath)) {
      return { ok: false, error: 'No se encontró config_local.json en engine.' };
    }

    const raw = fs.readFileSync(configPath, 'utf8');
    const cfg = JSON.parse(raw);

    return {
      ok: true,
      config: {
        camera_name: cfg.CAMERA_NAME ?? 'Cámara desconocida',
        rtsp_url: cfg.LIVE_CAMERA_URL ?? null,
      },
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

