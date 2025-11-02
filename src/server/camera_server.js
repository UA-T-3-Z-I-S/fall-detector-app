// src/server/camera_server.js
import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 8081;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer config_local.json
const CONFIG_PATH = path.join(__dirname, '../engine/config_local.json');
let LIVE_CAMERA_URL = '';
let CAMERA_NAME = '';

try {
  const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  LIVE_CAMERA_URL = configData.LIVE_CAMERA_URL || '';
  CAMERA_NAME = configData.CAMERA_NAME || 'Cámara sin nombre';
} catch (err) {
  console.error('Error leyendo config_local.json:', err);
  process.exit(1);
}

if (!LIVE_CAMERA_URL) {
  console.error('No se encontró LIVE_CAMERA_URL en config_local.json');
  process.exit(1);
}

// Endpoint para info de la cámara
app.get('/cam/info', (req, res) => {
  res.json({ camera_name: CAMERA_NAME, live_url: LIVE_CAMERA_URL });
});

// Endpoint que entrega un frame JPEG
app.get('/frame.jpg', (req, res) => {
  res.setHeader('Content-Type', 'image/jpeg');

  const ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp',
    '-i', LIVE_CAMERA_URL,
    '-frames:v', '1',        // solo un frame
    '-f', 'image2pipe',
    '-q:v', '5',
    'pipe:1'
  ]);

  ffmpeg.stdout.pipe(res);

  ffmpeg.stderr.on('data', () => {
    // silenciamos logs
  });

  ffmpeg.on('close', () => {});
});

app.listen(PORT, () => console.log(`Camera server corriendo en http://localhost:${PORT}`));
