export async function initNotificationsPanel() {
  try {
    const res = await fetch('./ui/components/notifications_panel.html');
    const html = await res.text();
    document.getElementById('notification-panel').innerHTML = html;

    // Aquí podrías agregar la lógica de notificaciones dinámicas en el futuro
  } catch (err) {
    console.error('Error cargando notifications_panel:', err);
  }
}
