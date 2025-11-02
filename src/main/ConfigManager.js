// src/main/ConfigManager.js - CORREGIDO
const fs = require('fs');
const path = require('path');

// 🔑 PASO CLAVE: Usamos la variable global establecida en main.js
// Esto es mucho más robusto que usar rutas relativas con __dirname
const BASE_DIR = global.APP_ROOT; 

// ============================================================
// 🧱 Función Auxiliar para la Lectura de system_local.json
// ============================================================

const readConfigFile = () => {
    const p = path.join(BASE_DIR, 'system_local.json');
    if (!fs.existsSync(p)) {
        throw new Error(`No existe system_local.json en: ${p}`);
    }
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
};


// ============================================================
// 🧠 CONFIG GENERAL Y AUTENTICACIÓN
// ============================================================

const readSystemConfig = async () => {
  try {
    // Usamos la función auxiliar
    const cfg = readConfigFile();
    return { ok: true, config: { username: cfg.USER_LOGIN?.username ?? null } };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
};

// 🔑 ¡CORRECCIÓN! Declaración de la función validateLogin
const validateLogin = async (_event, username, password) => { 
  try {
    const cfg = readConfigFile();

    const expectedUser = cfg.USER_LOGIN?.username ?? '';
    const expectedPass = Buffer.from(cfg.USER_LOGIN?.password ?? '', 'base64').toString('utf8');
    const success = username === expectedUser && password === expectedPass;

    if (success) {
      cfg.USER_SESSION.active = true;
      cfg.USER_SESSION.last_login = new Date().toISOString();
      fs.writeFileSync(path.join(BASE_DIR, 'system_local.json'), JSON.stringify(cfg, null, 2));
    }

    return { ok: true, success };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
};

// 🔑 ¡CORRECCIÓN! Declaración de la función logout
const logout = async (mainWindow) => {
  try {
    const p = path.join(BASE_DIR, 'system_local.json');
    const cfg = readConfigFile();

    cfg.USER_SESSION.active = false;
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
    
    // Recarga la ventana a index.html
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile(path.join(BASE_DIR, 'index.html'));
    }
    return true;
  } catch (e) {
    console.error('Error al cerrar sesión:', e);
    return false;
  }
};

// ============================================================
// ⚙️ CONFIGURACIÓN DE USUARIO
// ============================================================

// 🔑 ¡CORRECCIÓN! Declaración de la función readUserConfig
const readUserConfig = async () => {
  try {
    const cfg = readConfigFile();
    return { ok: true, config: { username: cfg.USER_LOGIN?.username ?? null } };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

// 🔑 ¡CORRECCIÓN! Declaración de la función updateUserConfig
const updateUserConfig = async (_event, { username, password }) => {
  try {
    const p = path.join(BASE_DIR, 'system_local.json');
    const cfg = readConfigFile();

    if (username) cfg.USER_LOGIN.username = username;
    if (password) cfg.USER_LOGIN.password = Buffer.from(password).toString('base64');
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

// ============================================================
// 📡 Leer configuración del motor (config_local.json)
// ============================================================

// 🔑 ¡CORRECCIÓN! Declaración de la función readEngineConfig
const readEngineConfig = async () => {
  try {
    const configPath = path.join(BASE_DIR, 'engine', 'config_local.json');
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
};


module.exports = {
  readSystemConfig,
  validateLogin,
  logout,
  readUserConfig,
  updateUserConfig,
  readEngineConfig,
};