import { loadResidents, loadPabellones } from './residentes/service.js';
import { renderTable } from './residentes/table.js';
import { openResidentFormModal } from './residentes_form.js';

export async function initModalResidentes() {
  try {
    // 🔹 Cargar modal al inicio, oculto
    const res = await fetch('./ui/components/modal_residentes.html');
    const html = await res.text();
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    const modalResidentes = container.querySelector('#modal-residentes');

    // 🔹 Listeners
    const closeBtn = modalResidentes.querySelector('#close-resident-modal-btn');
    const addResidentBtn = modalResidentes.querySelector('#add-resident-btn');
    const searchInput = modalResidentes.querySelector('#search-resident-input');
    const paginationContainer = modalResidentes.querySelector('.pagination');

    window.residentState = {
      ITEMS_PER_PAGE: 6,
      currentPage: 1,
      paginationContainer,
      searchInput
    };

    closeBtn.addEventListener('click', () => {
      modalResidentes.classList.add('hidden');
      loadResidents().then(renderTable);
    });

    addResidentBtn.addEventListener('click', () => openResidentFormModal());

    searchInput.addEventListener('input', e =>
      renderTable(1, e.target.value.toLowerCase())
    );

    document.addEventListener('resident-updated', () => loadResidents().then(renderTable));

    // 🔹 Cargar datos
    await loadPabellones();
    await loadResidents();
    renderTable();

    return modalResidentes;
  } catch (err) {
    console.error('Error cargando modal_residentes:', err);
    return null;
  }
}
