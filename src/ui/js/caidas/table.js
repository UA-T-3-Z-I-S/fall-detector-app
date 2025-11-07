import { getPreparedNotifications } from './service.js';
import { makeRowEditable } from './edit.js';
import { formatDateTime, formatTime } from './edit/utils.js';

export function renderTable(page = 1, search = '') {
  const notifications = getPreparedNotifications();
  const tbody = document.querySelector('#notificaciones-table tbody');
  if (!tbody) return;

  const ITEMS_PER_PAGE = 6;

  const filtered = notifications.filter(n => {
    const s = search.toLowerCase();
    return (
      n.camara.toLowerCase().includes(s) ||
      formatDateTime(n.timestamp).toLowerCase().includes(s) ||
      n.user.toLowerCase().includes(s) ||
      n.professionals.toLowerCase().includes(s) ||
      n.residents.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  page = Math.max(1, Math.min(page, totalPages));

  tbody.innerHTML = '';
  filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
    .forEach(n => {
      const tr = document.createElement('tr');

      let user = '-', professionals = '-', residents = '-', severity = '-', comments = '-', interventionTime = '-', caidaField = '-';

      if (n.regId) {
        user = n.user || '-';

        if (n.caida === true) {
          professionals = n.professionals || '-';
          residents = n.residents || '-';
          severity = n.severity || '-';
          comments = n.comments || '-';
          interventionTime = formatTime(n.interventionTime);
          caidaField = 'Sí';
        } else if (n.caida === false) {
          caidaField = 'No';
        }
      }

      tr.innerHTML = `
        <td>${n.camara} / ${formatDateTime(n.timestamp)}</td>
        <td>${user}</td>
        <td>${professionals}</td>
        <td>${residents}</td>
        <td>${caidaField}</td>
        <td>${severity}</td>
        <td>${comments}</td>
        <td>${interventionTime}</td>
        <td><button class="edit-btn" data-id="${n._id}">
          ${n.regId ? 'Editar' : 'Crear'}
        </button></td>
      `;

      tr.querySelector('.edit-btn')?.addEventListener('click', () => {
        makeRowEditable(tr, n);
      });

      tbody.appendChild(tr);
    });

  const paginationContainer = document.querySelector('#modal-notificaciones .pagination');
  if (paginationContainer) {
    paginationContainer.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.disabled = i === page;
      btn.addEventListener('click', () => renderTable(i, search));
      paginationContainer.appendChild(btn);
    }
  }

  document.addEventListener('caidas-updated', () => {
    const search = document.querySelector("#search-input")?.value || "";
    const currentPage = 1; // opcional: podrías guardar el page actual
    renderTable(currentPage, search);
  });

  // Cerrar cualquier edición activa antes de abrir otra
  document.addEventListener('restore-all-rows', () => {
    const editingRows = document.querySelectorAll('tr[data-editing="true"]');
    editingRows.forEach(tr => {
      tr.querySelector('.cancel-btn')?.click();
    });
  });

}
