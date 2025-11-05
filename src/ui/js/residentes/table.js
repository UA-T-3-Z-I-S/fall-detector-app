import { getResidentData, updateResident } from './service.js';
import { escapeHtml } from './validation.js';
import { makeRowEditable } from './edit.js';

/**
 * Calcula edad a partir de fecha de nacimiento en formato yyyy-mm-dd
 */
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return '';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }
  return edad;
}

/**
 * Formatea fecha YYYY-MM-DD → DD-MM-YYYY
 */
function formatDateDDMMYYYY(fecha) {
  if (!fecha) return '';
  const [yyyy, mm, dd] = fecha.slice(0, 10).split('-');
  return `${dd}-${mm}-${yyyy}`;
}

export function renderTable(page = 1, filter = '') {
  const { allResidents, pabellonesMap } = getResidentData();
  const tbody = document.querySelector('#residentes-table tbody');
  const { ITEMS_PER_PAGE, paginationContainer, searchInput } = window.residentState;

  filter = filter.toLowerCase?.() || '';

  // Filtrar por nombre, apellido, dni, sexo o pabellón
  let filtered = allResidents.filter(r => {
    const pabNombre = (pabellonesMap[r.pabellon] || '').toLowerCase();
    return (
      (r.nombre || '').toLowerCase().includes(filter) ||
      (r.apellido || '').toLowerCase().includes(filter) ||
      (r.dni || '').includes(filter) ||
      (r.sexo || '').toLowerCase().includes(filter) ||
      pabNombre.includes(filter)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;
  window.residentState.currentPage = page;

  tbody.innerHTML = '';
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  filtered.slice(start, end).forEach(resident => {
    const tr = document.createElement('tr');

    const edad = calcularEdad(resident.fecha_nacimiento);
    const fechaFormateada = formatDateDDMMYYYY(resident.fecha_nacimiento);

    tr.innerHTML = `
      <td class="td-nombre">${escapeHtml(resident.nombre)}</td>
      <td class="td-apellido">${escapeHtml(resident.apellido)}</td>
      <td class="td-dni">${escapeHtml(resident.dni)}</td>
      <td>${escapeHtml(resident.sexo)}</td>
      <td>${escapeHtml(fechaFormateada)}</td>
      <td>${edad}</td>
      <td>${escapeHtml(pabellonesMap[resident.pabellon] || '')}</td>
      <td>${resident.estado ? 'Activo' : 'Inactivo'}</td>
      <td class="td-actions">
        <button class="edit-btn">Editar</button>
        <button class="toggle-btn">${resident.estado ? 'Deshabilitar' : 'Habilitar'}</button>
      </td>
    `;

    tr.querySelector('.edit-btn').addEventListener('click', () =>
      makeRowEditable(tr, resident)
    );

    tr.querySelector('.toggle-btn').addEventListener('click', async () => {
      resident.estado = !resident.estado;
      await updateResident(resident._id, { ...resident });
      document.dispatchEvent(new Event('resident-updated'));
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
