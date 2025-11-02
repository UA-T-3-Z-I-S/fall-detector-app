// topbar.js
export async function initTopbar() {
  const html = await fetch('./ui/components/topbar.html').then(res => res.text());
  document.getElementById('topbar-container').innerHTML = html;

  const logoutBtn = document.getElementById('logout-btn');
  const engineToggle = document.getElementById('engine-toggle');
  const switchEl = document.querySelector('.slider');
  const label = document.getElementById('engine-label');
  const openConfigBtn = document.getElementById('open-config-btn');

  // Función para cambiar visualmente el switch
  const setState = (state, text) => {
    label.textContent = text;
    switch (state) {
      case 'off': switchEl.style.backgroundColor = '#e74c3c'; break;
      case 'starting': switchEl.style.backgroundColor = '#FFD54A'; break;
      case 'on': switchEl.style.backgroundColor = '#4CAF50'; break;
    }
  };

  // Logout
  logoutBtn.addEventListener('click', async () => await window.api.logout());

  // Estado inicial del motor
  const status = await window.api.checkEngine();
  if (status.ok && status.running) {
    engineToggle.checked = true;
    setState('on', 'Motor operativo');
  } else {
    setState('off', 'Motor apagado');
  }

  // Eventos del motor
  window.api.onEngineEvent(msg => {
    if (msg.evento === 'modelo_iniciando') setState('starting', 'Cargando modelo...');
    else if (msg.evento === 'modelo_listo') setState('starting', 'Esperando cámara...');
    else if (msg.evento === 'camara_activa') setState('on', 'Motor operativo');
    else if (msg.evento === 'advertencia' && msg.mensaje?.includes('No se pudo abrir RTSP')) {
      alert('⚠️ No se pudo abrir la cámara RTSP. Motor apagado.');
      setState('off', 'Motor apagado');
      engineToggle.checked = false;
    } else if (msg.evento === 'motor_finalizado' || msg.evento === 'error') {
      setState('off', 'Motor detenido');
      engineToggle.checked = false;
    }
  });

  // Toggle manual del motor
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

  return { setState }; // si quieres exponer funciones
}
