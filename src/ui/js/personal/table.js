import { getStaffData, updateStaff } from './service.js';
import { escapeHtml } from './validation.js';
import { makeRowEditable } from './edit.js';

export function renderTable(page = 1, filter = '') {
  const { allStaff, tiposMap } = getStaffData();
  const tbody = document.querySelector('#personal-table tbody');
  const { ITEMS_PER_PAGE, paginationContainer, searchInput } = window.personalState;

  filter = filter.toLowerCase?.() || '';

  let filtered = allStaff.filter(s => {
    const tipoNombre = (tiposMap[s.tipo] || '').toLowerCase();
    return (
      (s.nombre || '').toLowerCase().includes(filter) ||
      (s.apellido || '').toLowerCase().includes(filter) ||
      (s.dni || '').includes(filter) ||
      tipoNombre.includes(filter)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;
  window.personalState.currentPage = page;

  tbody.innerHTML = '';
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  filtered.slice(start, end).forEach(staff => {
    const tr = document.createElement('tr');

    // Normalizamos horarios igual que en el edit.js
    let horarios = [];
    if (Array.isArray(staff.horarios) && staff.horarios.length) {
      horarios = staff.horarios;
    } else if (Array.isArray(staff.horario) && staff.horario.length) {
      horarios = staff.horario.map(h => ({
        dia: h.dia ? h.dia.toUpperCase() : "LUNES",
        hora_inicio: h.hora_inicio || h.inicio || "",
        hora_fin: h.hora_fin || h.fin || ""
      }));
    }

    const horarioStr = horarios
      .map(h => `${h.dia} ${h.hora_inicio}-${h.hora_fin}`)
      .join('<br>');

    tr.innerHTML = `
      <td class="td-nombre">${escapeHtml(staff.nombre)}</td>
      <td class="td-apellido">${escapeHtml(staff.apellido)}</td>
      <td class="td-dni">${escapeHtml(staff.dni)}</td>
      <td class="td-telefono">${escapeHtml(staff.telefono)}</td>
      <td>${escapeHtml(tiposMap[staff.tipo] || '')}</td>
      <td>${staff.estado ? 'Activo' : 'Inactivo'}</td>
      <td>${(staff.pwas || []).length}</td>
      <td>${staff.test ? 'Sí' : 'No'}</td>
      <td>${horarioStr}</td>
      <td class="td-actions">
        <button class="edit-btn">Editar</button>
        <button class="toggle-btn">${staff.estado ? 'Deshabilitar' : 'Habilitar'}</button>
      </td>
    `;

    tr.querySelector('.edit-btn').addEventListener('click', () =>
      makeRowEditable(tr, staff)
    );

    tr.querySelector('.toggle-btn').addEventListener('click', async () => {
      staff.estado = !staff.estado;
      await updateStaff(staff._id, { ...staff });
      document.dispatchEvent(new Event('staff-updated'));
    });

    tbody.appendChild(tr);
  });

  // Paginación
  paginationContainer.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.disabled = i === page;
    btn.addEventListener('click', () =>
      renderTable(i, searchInput.value.toLowerCase())
    );
    paginationContainer.appendChild(btn);
  }
}
