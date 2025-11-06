// fall-detector-app/main/IpcHandlers.js
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { startEngine, stopEngine, stopEngineSilently, checkEngineStatus } = require('./EngineController');

const BASE_DIR = global.APP_ROOT;
const CFG_PATH = path.join(BASE_DIR, 'system_local.json');
const ENGINE_CFG_PATH = path.join(BASE_DIR, 'engine', 'config_local.json');

function readSystemConfigInternal() {
    if (!fs.existsSync(CFG_PATH)) {
        throw new Error('No existe system_local.json');
    }
    const raw = fs.readFileSync(CFG_PATH, 'utf8');
    return JSON.parse(raw);
}

function setupIpcHandlers(mainWindow) {
    if (ipcMain._handlersSetup) {
        console.log('⚠ IPC handlers ya están registrados, saltando duplicados.');
        return;
    }

    // ==========================
    // Config y login
    // ==========================
    ipcMain.handle('read-system-config', async () => {
        try {
            const cfg = readSystemConfigInternal();
            return { ok: true, config: { username: cfg.USER_LOGIN?.username ?? null } };
        } catch (err) {
            return { ok: false, error: err.message || String(err) };
        }
    });

    ipcMain.handle('validate-login', async (_event, username, password) => {
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

    if (!ipcMain._openDashboardRegistered) {
        ipcMain.on('open-dashboard', () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.loadFile(path.join(BASE_DIR, 'dashboard.html'));
            }
        });
        ipcMain._openDashboardRegistered = true;
    }

    // ==========================
    // Motor IA
    // ==========================
    if (!ipcMain._engineHandlersRegistered) {
        ipcMain.handle('start-engine', async () => await startEngine(mainWindow));
        ipcMain.handle('stop-engine', async () => await stopEngine());
        ipcMain.handle('check-engine-status', async () => await checkEngineStatus());
        ipcMain._engineHandlersRegistered = true;
    }

    // ==========================
    // Config usuario
    // ==========================
    if (!ipcMain._userHandlersRegistered) {
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
        ipcMain._userHandlersRegistered = true;
    }

    // ==========================
    // Config motor IA
    // ==========================
    if (!ipcMain._engineConfigRegistered) {
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
        ipcMain._engineConfigRegistered = true;
    }

    ipcMain._handlersSetup = true; // ✅ bandera final
    console.log('✅ IPC handlers configurados correctamente');
}

module.exports = { setupIpcHandlers };
