import { loadAllData, getPreparedNotifications } from './caidas/service.js';
import { renderTable } from './caidas/table.js';

export async function initModalNotificaciones() {
  try {
    const res = await fetch('./ui/components/modal_notificaciones.html');
    const container = document.createElement('div');
    container.innerHTML = await res.text();
    document.body.appendChild(container);

    const modal = container.querySelector('#modal-notificaciones');
    const closeBtn = modal.querySelector('#close-notification-modal-btn');
    const searchInput = modal.querySelector('#search-notification-input');

    // Buscador
    searchInput?.addEventListener('input', e =>
      renderTable(1, e.target.value.toLowerCase())
    );

    // Botón cerrar
    closeBtn?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // 🔹 Aquí primero cargamos TODO
    await loadAllData();

    // 🔹 Luego renderizamos, ahora ya tiene caídas, staff y residentes
    renderTable();

    return modal;

  } catch (e) {
    console.error('Error cargando modal_notificaciones:', e);
    return null;
  }
}
