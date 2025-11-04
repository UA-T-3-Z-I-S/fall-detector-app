import { initModalPersonal } from './footer_personal.js';

export async function initFooterPanel() {
  try {
    const res = await fetch('./ui/components/footer.html');
    const html = await res.text();
    document.getElementById('bottom-panel').innerHTML = html;

    const btnProfesionales = document.getElementById('btn-profesionales');
    const btnResidentes = document.getElementById('btn-residentes');

    const modalPersonal = await initModalPersonal();

    btnProfesionales?.addEventListener('click', () => {
      modalPersonal?.classList.remove('hidden');
    });

    btnResidentes?.addEventListener('click', () => {
      console.log('Click en Residentes');
    });

  } catch (err) {
    console.error('Error cargando footer_panel:', err);
  }
}
