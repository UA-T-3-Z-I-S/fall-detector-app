// src/ui/js/footer_personal.js
import { loadTipos, loadStaff, getStaffData } from './personal/service.js';
import { renderTable } from './personal/table.js';
import { openStaffFormModal } from './personal_form.js';

export async function initModalPersonal() {
  try {
    const res = await fetch('./ui/components/modal_personal.html');
    const html = await res.text();
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    const modalPersonal = document.getElementById('modal-personal');
    const closeBtn = document.getElementById('close-modal-btn');
    const addStaffBtn = document.getElementById('add-staff-btn');
    const searchInput = modalPersonal.querySelector('#search-input');
    const paginationContainer = modalPersonal.querySelector('.pagination');

    window.personalState = {
      ITEMS_PER_PAGE: 10,
      currentPage: 1,
      paginationContainer,
      searchInput
    };

    document.addEventListener('staff-updated', () => loadStaff().then(renderTable));

    closeBtn?.addEventListener('click', () => {
      modalPersonal.classList.add('hidden');
      loadStaff().then(renderTable);
    });

    addStaffBtn?.addEventListener('click', () => openStaffFormModal());

    searchInput.addEventListener('input', e =>
      renderTable(1, e.target.value.toLowerCase())
    );

    await loadTipos();
    await loadStaff();
    renderTable();

    return modalPersonal;
  } catch (err) {
    console.error('Error cargando modal_personal:', err);
    return null;
  }
}
