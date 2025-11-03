// src/server/camera_server.js
import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 8081;

app.use(express.json()); // ✅ Necesario para POST JSON

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, '../engine/config_local.json');

let LIVE_CAMERA_URL = '';
let CAMERA_NAME = '';

function loadConfig() {
  try {
    const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    LIVE_CAMERA_URL = configData.LIVE_CAMERA_URL || '';
    CAMERA_NAME = configData.CAMERA_NAME || 'Cámara sin nombre';
    console.log("✅ Config cargada:", CAMERA_NAME, LIVE_CAMERA_URL);
  } catch (err) {
    console.error('❌ Error leyendo config_local.json:', err);
  }
}

loadConfig();

// 🔹 GET — Info de la cámara
app.get('/cam/info', (req, res) => {
  res.json({
    camera_name: CAMERA_NAME,
    live_url: LIVE_CAMERA_URL
  });
});

// 🆕 POST — Actualizar config en disco + recalgar memoria
app.post('/cam/update', (req, res) => {
  try {
    const { camera_name, camera_url } = req.body;
    const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

    if (camera_name) configData.CAMERA_NAME = camera_name;
    if (camera_url) configData.LIVE_CAMERA_URL = camera_url;

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf8');

    loadConfig(); // ✅ aplicar cambios en memoria

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al actualizar config:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// 🔹 Endpoint de la imagen JPEG
app.get('/frame.jpg', (req, res) => {
  res.setHeader('Content-Type', 'image/jpeg');

  const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-i', LIVE_CAMERA_URL,
    '-frames:v', '1',
    '-f', 'image2pipe',
    '-q:v', '5',
    'pipe:1'
  ]);

  ffmpeg.stdout.pipe(res);

  ffmpeg.stderr.on('data', () => {});
  ffmpeg.on('close', () => {});
});

app.listen(PORT, () => 
  console.log(`📡 Camera server en http://localhost:${PORT}`)
);
