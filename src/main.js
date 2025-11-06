const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
global.APP_ROOT = __dirname;
const { stopEngineSilently } = require('./main/EngineController');
const { MongoClient, ObjectId } = require('mongodb');

let mainWindow;
let cameraServerProcess;

// --- CARGAR CONFIGURACIÓN ---
let mongoConfig;
try {
  const cfgPath = path.join(global.APP_ROOT, 'system_local.json');
  const raw = fs.readFileSync(cfgPath, 'utf8');
  mongoConfig = JSON.parse(raw);
} catch (err) {
  console.error('[Main] Error leyendo system_local.json:', err);
  process.exit(1);
}

// --- MONGO ---
const client = new MongoClient(mongoConfig.MONGO_URI);
let db;

async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db(mongoConfig.MONGO_DB_NAME);
    console.log(`✅ Conectado a MongoDB Atlas (DB: ${mongoConfig.MONGO_DB_NAME})`);
  }
  return db;
}

// --- IPC HANDLERS ---
ipcMain.handle('mongo-query', async (_e, { collection, query = {} }) => {
  const db = await getDB();
  return db.collection(collection).find(query).toArray();
});

ipcMain.handle('mongo-insert', async (_e, { collection, doc }) => {
  const db = await getDB();
  return db.collection(collection).insertOne(doc);
});

ipcMain.handle('mongo-update', async (_e, { collection, id, data }) => {
  console.log('[IPC] mongo-update llamado con:', { collection, id, data });

  const db = await getDB();

  let objectId;
  try {
    objectId = id instanceof ObjectId
      ? id
      : new ObjectId(id._id?.buffer || id.buffer || id);
  } catch (err) {
    console.error('Error convirtiendo _id a ObjectId:', id, err);
    throw err;
  }

  const { _id, updated_at, ...dataToSet } = data;

  const result = await db.collection(collection).updateOne(
    { _id: objectId },
    { $set: dataToSet, $currentDate: { updated_at: true } }
  );

  console.log('[Mongo] updateOne result:', result);
  return result;
});

// --- Canal para notificaciones en tiempo real ---
ipcMain.on('notificacion-en-panel', (_e, notif) => {
  console.log('📡 Notificación enviada al panel:', notif);
  if (mainWindow) mainWindow.webContents.send('notificacion-en-panel', notif);
});

// --- Cámara (servidor externo) ---
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

// --- Crear ventana principal ---
async function createWindow() {
  try { await getDB(); } catch (err) { console.error('[Main] Error inicializando DB:', err); }
  startCameraServer();

  mainWindow = new BrowserWindow({
    width: 1120,
    height: 720,
    webPreferences: {
      preload: path.join(global.APP_ROOT, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  try {
    const { setupIpcHandlers } = require('./main/IpcHandlers');
    setupIpcHandlers(mainWindow);
  } catch (err) {
    console.warn('[Main] No se pudo cargar setupIpcHandlers:', err);
  }

  try {
    if (mongoConfig.USER_SESSION?.active) {
      mainWindow.loadFile(path.join(global.APP_ROOT, 'dashboard.html'));
    } else {
      mainWindow.loadFile(path.join(global.APP_ROOT, 'index.html'));
    }
  } catch (err) {
    console.error('[Main] Error cargando ventana inicial:', err);
    mainWindow.loadFile(path.join(global.APP_ROOT, 'index.html'));
  }
}

// --- Eventos de app ---
app.whenReady().then(createWindow);

app.on('will-quit', () => {
  stopEngineSilently();
  if (cameraServerProcess) cameraServerProcess.kill('SIGINT');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

module.exports.getMainWindow = () => mainWindow;
