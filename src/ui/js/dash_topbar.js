export async function initTopbar() {
  const html = await fetch('./ui/components/topbar.html').then(res => res.text());
  document.getElementById('topbar-container').innerHTML = html;

  const logoutBtn = document.getElementById('logout-btn');
  const engineToggle = document.getElementById('engine-toggle');
  const switchEl = document.querySelector('.slider');
  const label = document.getElementById('engine-label');
  const testAlertBtn = document.getElementById('test-alert-btn');

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

  // --- Botón alerta de prueba ---
  testAlertBtn.addEventListener('click', async () => {
    try {
      const engineConfig = await window.api.readEngineConfig();
      const cameraName = (engineConfig?.CAMERA_NAME || 'TEST');

      const simulatedFall = {
        evento: 'caida_detectada',
        camara: cameraName,
        timestamp: new Date().toISOString(),
        buffer_ts: new Date(Date.now() - 20000).toISOString(),
        estado: 0
      };

      // Guardar en MongoDB
      await window.api.insertMongo("notificaciones_albergue", simulatedFall);
      console.log('💾 Alerta de prueba simulada guardada:', simulatedFall);

      // Enviar notificación en vivo al panel
      window.api.sendNotification(simulatedFall);

    } catch (err) {
      console.error('❌ Error simulando alerta de prueba:', err);
    }
  });

  return { setState };
}
