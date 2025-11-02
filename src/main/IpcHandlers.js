// fall-detector-app/main/IpcHandlers.js
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { startEngine, stopEngine, stopEngineSilently, checkEngineStatus, getEngineProcess } = require('./EngineController');
// Eliminado getMainWindow para evitar ciclo de dependencias

const BASE_DIR = global.APP_ROOT;
const CFG_PATH = path.join(BASE_DIR, 'system_local.json');
const ENGINE_CFG_PATH = path.join(BASE_DIR, 'engine', 'config_local.json');

/**
 * Función central para leer system_local.json
 * @returns {object} El objeto de configuración completo.
 */
function readSystemConfigInternal() {
    if (!fs.existsSync(CFG_PATH)) {
        throw new Error('No existe system_local.json');
    }
    const raw = fs.readFileSync(CFG_PATH, 'utf8');
    return JSON.parse(raw);
}

/**
 * Registra todos los manejadores IPC (ipcMain.handle/on)
 * @param {BrowserWindow} mainWindow - La ventana principal de Electron.
 */
function setupIpcHandlers(mainWindow) {
    // ============================================================
    // ⚙️ FUNCIONES COMUNES (Tu lógica anterior)
    // ============================================================

    ipcMain.handle('read-system-config', async () => {
        try {
            const cfg = readSystemConfigInternal();
            return { ok: true, config: { username: cfg.USER_LOGIN?.username ?? null } };
        } catch (err) {
            return { ok: false, error: err.message || String(err) };
        }
    });

    ipcMain.handle('validate-login', async (event, username, password) => {
        try {
            const cfg = readSystemConfigInternal();
            const expectedUser = cfg.USER_LOGIN?.username ?? '';
            const expectedPass = Buffer.from(cfg.USER_LOGIN?.password ?? '', 'base64').toString('utf8');
            const success = username === expectedUser && password === expectedPass;

            if (success) {
                cfg.USER_SESSION.active = true;
                cfg.USER_SESSION.last_login = new Date().toISOString();
                fs.writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2));
            }

            return { ok: true, success };
        } catch (err) {
            return { ok: false, error: err.message || String(err) };
        }
    });

    ipcMain.handle('logout', async () => {
        try {
            const cfg = readSystemConfigInternal();
            cfg.USER_SESSION.active = false;
            fs.writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2));
            // Usar la referencia mainWindow pasada por setupIpcHandlers
            if (mainWindow && !mainWindow.isDestroyed()) {
                stopEngineSilently();
                mainWindow.loadFile(path.join(BASE_DIR, 'index.html'));
            }
            return true;
        } catch (e) {
            console.error('Error al cerrar sesión:', e);
            return false;
        }
    });

    ipcMain.on('open-dashboard', () => {
        try {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.loadFile(path.join(BASE_DIR, 'dashboard.html'));
            }
        } catch (e) {
            console.error('open-dashboard error:', e);
        }
    });

    // ============================================================
    // 🧠 CONTROL DEL MOTOR IA (Llama a funciones de EngineController)
    // ============================================================

    ipcMain.handle('start-engine', async () => {
        // Usar la referencia mainWindow pasada por setupIpcHandlers
        const result = await startEngine(mainWindow);
        return result;
    });

    ipcMain.handle('stop-engine', async () => {
        return await stopEngine();
    });

    ipcMain.handle('check-engine-status', async () => {
        return await checkEngineStatus();
    });


    // ============================================================
    // ⚙️ Configuración de usuario
    // ============================================================

    ipcMain.handle('read-user-config', async () => {
        try {
            const cfg = readSystemConfigInternal();
            return { ok: true, config: { username: cfg.USER_LOGIN?.username ?? null } };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    });

    ipcMain.handle('update-user-config', async (_event, { username, password }) => {
        try {
            const cfg = readSystemConfigInternal();
            if (username) cfg.USER_LOGIN.username = username;
            if (password) cfg.USER_LOGIN.password = Buffer.from(password).toString('base64');
            fs.writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2));
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    });

    // ============================================================
    // 📡 Leer configuración del motor (config_local.json)
    // ============================================================
    ipcMain.handle('read-engine-config', async () => {
        try {
            if (!fs.existsSync(ENGINE_CFG_PATH)) {
                return { ok: false, error: 'No se encontró config_local.json en engine.' };
            }

            const raw = fs.readFileSync(ENGINE_CFG_PATH, 'utf8');
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

}

module.exports = { setupIpcHandlers };
