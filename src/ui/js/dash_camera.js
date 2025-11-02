// camera.js
export async function initCameraPanel() {
  const res = await fetch('./ui/components/camera_panel.html');
  const html = await res.text();
  document.getElementById('camera-container').innerHTML = html;

  const placeholder = document.getElementById('cam-placeholder');
  const videoEl = document.getElementById('cam1');
  const labelEl = document.querySelector('.camera-label');

  const engineCfg = await window.api.readEngineConfig();
  if (engineCfg.ok) {
    labelEl.textContent = engineCfg.config.camera_name || 'Cámara sin nombre';
  } else {
    labelEl.textContent = 'Cámara desconocida';
    console.warn('No se pudo leer config_local.json:', engineCfg.error);
  }

  window.api.onEngineEvent(msg => {
    if (msg.evento === 'camara_activa') {
      placeholder.style.display = 'none';
      videoEl.style.display = 'block';
    } else if (msg.evento === 'motor_finalizado' || msg.evento === 'advertencia') {
      videoEl.style.display = 'none';
      placeholder.style.display = 'block';
    }
  });
}
