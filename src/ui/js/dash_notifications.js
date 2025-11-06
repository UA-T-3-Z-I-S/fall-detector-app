// ==========================================================
// 📌 INICIALIZAR PANEL DE NOTIFICACIONES
// ==========================================================
export async function initNotificationsPanel() {
  try {
    const res = await fetch('./ui/components/notifications_panel.html');
    const html = await res.text();
    document.getElementById('notification-panel').innerHTML = html;

    console.log("✅ Panel de notificaciones cargado");

    // Simulación mientras el motor no manda eventos
    simulateEngineEvent();

    // Listener reales (cuando el motor esté conectado)
    window.api.onEngineEvent((data) => {
      if (data?.evento === "caida_detectada") {
        addNotificationToUI(data);
      }
    });

  } catch (err) {
    console.error('❌ Error cargando notifications_panel:', err);
  }
}

// ==========================================================
// ✅ RENDER DE NOTIFICACIÓN EN UI
// ==========================================================
function addNotificationToUI({ camara, timestamp }) {
  const panel = document.getElementById("notifi-list");
  if (!panel) return console.warn("⚠ notifi-list no existe en DOM");

  const card = document.createElement("div");
  card.className = "notif-card";

  const hora = new Date(timestamp).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  card.innerHTML = `
    <div class="notif-title">🚨 Caída detectada</div>
    <div class="notif-row"><strong>Ubicación:</strong> ${camara}</div>
    <div class="notif-row"><strong>Hora:</strong> ${hora}</div>
  `;

  panel.prepend(card);
}

// ==========================================================
// 🧪 SIMULACIÓN EXACTA DEL EVENTO DEL MOTOR
// ==========================================================
/*function simulateEngineEvent() {
  const fakeEvent = {
    evento: "caida_detectada",
    camara: "CAM-SALA",
    timestamp: new Date().toISOString(),
    porcentaje: 0.87,
    buffers_totales: 16,
    buffer_ts: Date.now() - 2000,
    buffers_cleared: 58,
    detecciones_consecutivas: 1
  };

  console.log("📩 Evento simulado ->", fakeEvent);

  addNotificationToUI(fakeEvent);
}*/
