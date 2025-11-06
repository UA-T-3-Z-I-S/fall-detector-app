// fall-detector-app/main/EngineController.js
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

let engineProcess = null; // 🧠 referencia al proceso .exe
const BASE_DIR = global.APP_ROOT;

/**
 * 🧹 Detener motor de forma segura
 */
function stopEngineSilently() {
  try {
    if (engineProcess) {
      // Usa process.kill con el PID del grupo para asegurar que todos los subprocesos se detengan
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

/**
 * 🚀 Iniciar el motor IA
 * @param {BrowserWindow} mainWindow - Ventana para enviar eventos.
 * @returns {object} Resultado de la operación.
 */
async function startEngine(mainWindow) {
  try {
    if (engineProcess) {
      return { ok: false, message: 'El motor ya está en ejecución' };
    }

    const engineDir = path.join(BASE_DIR, 'engine');
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
    

    // 🔍 Procesar la salida (stdout/stderr)
    const handleEngineOutput = (chunk, source = 'stdout') => {
      const text = chunk.toString().trim();
      for (const rawLine of text.split('\n')) {
        const line = rawLine.replace(/[^\x20-\x7E{}[\]":,._-]/g, '').trim();
        try {
          const msg = JSON.parse(line);

          // 📡 Log completo de cada mensaje JSON
          console.log('📡 Mensaje del motor:', msg);

          if (msg.evento && mainWindow) {
            mainWindow.webContents.send('engine-event', msg);

            // 🚨 Si hay error RTSP, detener automáticamente
            if (msg.evento === 'advertencia' && msg.mensaje?.includes('No se pudo abrir RTSP')) {
              console.warn('🚨 Advertencia RTSP detectada, deteniendo motor...');
              stopEngineSilently();
              mainWindow.webContents.send('engine-event', { evento: 'motor_apagado_rtsp' });
            }
          }

            if (msg.evento === 'caida_detectada') {
            console.log(`⚠️ Caída detectada en ${msg.camara} a las ${msg.timestamp}`);
            mainWindow.webContents.send('notification', {
                tipo: 'caida',
                camara: msg.camara,
                timestamp: msg.timestamp,
                buffer_ts: msg.buffer_ts // tu buffer de la caída
            });
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
}

/**
 * ✋ Detener motor manualmente (IPC handler)
 * @returns {object} Resultado de la operación.
 */
async function stopEngine() {
  try {
    stopEngineSilently();
    return { ok: true };
  } catch (err) {
    console.error('Error al detener motor:', err);
    return { ok: false, message: err.message };
  }
}

/**
 * 🩺 Verificar si el motor está corriendo
 * @returns {object} Estado de la operación.
 */
async function checkEngineStatus() {
  return new Promise((resolve) => {
    if (engineProcess) {
        // Si tenemos referencia al proceso, es un chequeo rápido
        return resolve({ ok: true, running: true });
    }
    
    // Si no hay referencia, verificamos si hay procesos huérfanos
    exec('tasklist', (err, stdout) => {
      if (err) return resolve({ ok: false, running: false });
      const isRunning = stdout.toLowerCase().includes('fall_detector.exe');
      resolve({ ok: true, running: isRunning });
    });
  });
}

module.exports = { startEngine, stopEngine, stopEngineSilently, checkEngineStatus };
