import { initModalPersonal } from './footer_personal.js';
import { initModalResidentes } from './footer_residentes.js';
import { initModalNotificaciones } from './footer_caidas.js';

import { loadAllData } from './caidas/service.js';
import { renderTable } from './caidas/table.js';

let lastLoadTime = 0;
const REFRESH_INTERVAL = 10_000; // 10 segundos, ajustable

async function ensureFreshData() {
  const now = Date.now();
  if (now - lastLoadTime > REFRESH_INTERVAL) {
    console.log('🔄 Refrescando datos al abrir modal...');
    await loadAllData();
    lastLoadTime = now;
  }
  renderTable();
}

export async function initFooterPanel() {
  try {
    const res = await fetch('./ui/components/footer.html');
    const html = await res.text();
    document.getElementById('bottom-panel').innerHTML = html;

    const btnProfesionales = document.getElementById('btn-profesionales');
    const btnResidentes = document.getElementById('btn-residentes');
    const btnCaidas = document.getElementById('btn-caidas');

    const modalPersonal = await initModalPersonal();
    btnProfesionales?.addEventListener('click', () =>
      modalPersonal.classList.remove('hidden')
    );

    const modalResidentes = await initModalResidentes();
    btnResidentes?.addEventListener('click', () =>
      modalResidentes.classList.remove('hidden')
    );

    const modalCaidas = await initModalNotificaciones();

    btnCaidas?.addEventListener('click', async () => {
      await ensureFreshData(); // ✅ solo 1 reload si corresponde
      modalCaidas.classList.remove('hidden');
    });

    document.addEventListener('caidas-updated', async () => {
      console.log('✅ Actualizado por edición');
      await loadAllData();
      lastLoadTime = Date.now();
      renderTable();
    });

  } catch (err) {
    console.error('Error cargando footer_panel:', err);
  }
}
