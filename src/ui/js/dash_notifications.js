const PANEL_ID = "notification-panel";
const LIST_ID = "notifi-list";

// 🔑 bandera global para evitar listeners duplicados
let notificationsListenerRegistered = false;

// --- Export para inicializar el panel de notificaciones ---
export async function initNotificationsPanel() {
  console.log("✅ initNotificationsPanel() iniciado");

  const container = document.getElementById(PANEL_ID);
  if (!container) return console.error(`❌ #${PANEL_ID} no está en DOM`);

  try {
    // Cargar estructura HTML del panel si es que no está inline
    const res = await fetch("./ui/components/notifications_panel.html");
    container.innerHTML = await res.text();
    console.log("✅ Panel de notificaciones cargado en DOM");

    // --- Seleccionar botón de recarga existente ---
    const header = container.querySelector(".notifications-header");
    if (header) {
      let reloadBtn = header.querySelector(".reload-notifs");

      // Si no existe, crearlo
      if (!reloadBtn) {
        reloadBtn = document.createElement("span");
        reloadBtn.textContent = " 🔄";
        reloadBtn.className = "reload-notifs";
        reloadBtn.style.cursor = "pointer";
        reloadBtn.title = "Recargar notificaciones últimas 36 horas";
        header.appendChild(reloadBtn);
      }

      // ⚡ Agregar listener (solo si no está ya)
      if (!reloadBtn.dataset.listener) {
        reloadBtn.addEventListener("click", () => loadRecentNotifications());
        reloadBtn.dataset.listener = "true"; // marca que ya tiene listener
      }
    }

    // Cargar notificaciones iniciales
    await loadRecentNotifications();

    // Escuchar notificaciones en tiempo real, solo una vez
    if (!notificationsListenerRegistered) {
      listenForNotifications();
      notificationsListenerRegistered = true;
    }

  } catch (err) {
    console.error("❌ Error cargando notifications_panel.html:", err);
  }
}

// --- Función para recargar las últimas 36 horas ---
async function loadRecentNotifications() {
  const panel = document.getElementById(LIST_ID);
  if (!panel) return console.warn("⚠ notifi-list no existe en DOM");

  // Limpiar panel antes de recargar
  panel.innerHTML = "";

  const now = new Date();
  const cutoff = new Date(now.getTime() - 36 * 3600 * 1000);

  try {
    const recentNotifs = await window.api.queryMongo("notificaciones_albergue", {
      timestamp: { $gte: cutoff.toISOString() }
    });
    recentNotifs.forEach(addNotificationToUI);
    console.log(`🔄 Recargadas ${recentNotifs.length} notificaciones últimas 36 horas`);
  } catch (err) {
    console.error("❌ Error recargando notificaciones:", err);
  }
}

// --- Escucha notificaciones en tiempo real ---
function listenForNotifications() {
  console.log("📡 Escuchando notificaciones IA en tiempo real...");

  window.api.onNotification((msg) => {
    console.log("📨 Notificación recibida:", msg);

    if (!msg.camara || !msg.timestamp) {
      console.warn("Notificación inválida:", msg);
      return;
    }

    // 🔑 Evitar duplicados exactos en Mongo y UI
    const panel = document.getElementById(LIST_ID);
    if (panel && Array.from(panel.children).some(card => card.dataset.timestamp === msg.timestamp && card.querySelector('.notif-row strong').textContent.includes(msg.camara))) {
      console.log("⚠ Notificación ya existe en panel, ignorando:", msg);
      return;
    }

    addNotificationToUI(msg);

    // Guardar en MongoDB, solo si no existe
    window.api.queryMongo("notificaciones_albergue", { timestamp: msg.timestamp, camara: msg.camara })
      .then(existing => {
        if (existing.length === 0) {
          window.api.insertMongo("notificaciones_albergue", msg)
            .then(() => console.log("💾 Notificación guardada en MongoDB"))
            .catch(err => console.error("❌ Error guardando notificación en DB:", err));
        } else {
          console.log("⚠ Notificación ya existe en DB, no se inserta:", msg);
        }
      })
      .catch(err => console.error("❌ Error verificando duplicado en DB:", err));
  });
}

// --- Añadir notificación al panel ---
function addNotificationToUI({ camara, timestamp, estado }) {
  const panel = document.getElementById(LIST_ID);
  if (!panel) return console.warn("⚠ notifi-list no existe en DOM");

  const card = document.createElement("div");
  card.className = "notif-card";
  card.dataset.timestamp = timestamp;

  const hora = new Date(timestamp).toLocaleTimeString("es-PE", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  const tipo = estado === 0 ? "🚨" : "🚨";

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
