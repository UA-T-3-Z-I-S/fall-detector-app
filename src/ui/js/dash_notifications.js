const PANEL_ID = "notification-panel";
const LIST_ID = "notifi-list";

export async function initNotificationsPanel() {
  console.log("✅ initNotificationsPanel() iniciado");

  const container = document.getElementById(PANEL_ID);
  if (!container) return console.error(`❌ #${PANEL_ID} no está en DOM`);

  try {
    // Cargar estructura HTML del panel
    const res = await fetch("./ui/components/notifications_panel.html");
    container.innerHTML = await res.text();
    console.log("✅ Panel de notificaciones cargado en DOM");

    // 1️⃣ Cargar notificaciones de las últimas 36 horas
    const now = new Date();
    const cutoff = new Date(now.getTime() - 36 * 3600 * 1000);
    const recentNotifs = await window.api.queryMongo("notificaciones_albergue", {
      timestamp: { $gte: cutoff.toISOString() }
    });
    recentNotifs.forEach(addNotificationToUI);

    // 2️⃣ Escuchar notificaciones en tiempo real
    listenForNotifications();

  } catch (err) {
    console.error("❌ Error cargando notifications_panel.html:", err);
  }
}

function listenForNotifications() {
  console.log("📡 Escuchando notificaciones IA en tiempo real...");

  window.api.onNotification((msg) => {
    console.log("📨 Notificación recibida:", msg);

    if (!msg.camara || !msg.timestamp) {
      console.warn("Notificación inválida:", msg);
      return;
    }

    addNotificationToUI(msg);

    // Guardar en MongoDB si no está ya
    window.api.insertMongo("notificaciones_albergue", msg)
      .then(() => console.log("💾 Notificación guardada en MongoDB"))
      .catch(err => console.error("❌ Error guardando notificación en DB:", err));
  });
}

function addNotificationToUI({ camara, timestamp, estado }) {
  const panel = document.getElementById(LIST_ID);
  if (!panel) return console.warn("⚠ notifi-list no existe en DOM");

  const card = document.createElement("div");
  card.className = "notif-card";
  card.dataset.timestamp = timestamp;

  const hora = new Date(timestamp).toLocaleTimeString("es-PE", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  const tipo = estado === 0 ? "🧪 Prueba" : "🚨 Real";

  card.innerHTML = `
    <div class="notif-title">${tipo} - Caída detectada</div>
    <div class="notif-row"><strong>Ubicación:</strong> ${camara}</div>
    <div class="notif-row"><strong>Hora:</strong> ${hora}</div>
  `;

  panel.prepend(card);

  // Mantener solo últimas 36 horas
  const now = new Date();
  const cutoff = new Date(now.getTime() - 36 * 3600 * 1000);
  Array.from(panel.children).forEach(card => {
    if (new Date(card.dataset.timestamp) < cutoff) panel.removeChild(card);
  });
}

console.log("✅ dash_notifications.js importado con éxito");
