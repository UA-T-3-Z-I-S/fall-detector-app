import { initModalPersonal } from './footer_personal.js';
import { initModalResidentes } from './footer_residentes.js';

export async function initFooterPanel() {
  try {
    const res = await fetch('./ui/components/footer.html');
    const html = await res.text();
    document.getElementById('bottom-panel').innerHTML = html;

    const btnProfesionales = document.getElementById('btn-profesionales');
    const btnResidentes = document.getElementById('btn-residentes');

    // 🔹 Modal de personal
    const modalPersonal = await initModalPersonal();
    btnProfesionales?.addEventListener('click', () => {
      modalPersonal.classList.remove('hidden');
    });

    // 🔹 Modal de residentes
    const modalResidentes = await initModalResidentes();
    btnResidentes?.addEventListener('click', () => {
      modalResidentes.classList.remove('hidden');
    });

  } catch (err) {
    console.error('Error cargando footer_panel:', err);
  }
}
