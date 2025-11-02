export async function initFooterPanel() {
  try {
    const res = await fetch('./ui/components/footer.html');
    const html = await res.text();
    document.getElementById('bottom-panel').innerHTML = html;

    // Aquí podrías agregar listeners para los botones en el futuro
    const btnProfesionales = document.getElementById('btn-profesionales');
    const btnResidentes = document.getElementById('btn-residentes');

    btnProfesionales?.addEventListener('click', () => {
      console.log('Click en Profesionales');
    });

    btnResidentes?.addEventListener('click', () => {
      console.log('Click en Residentes');
    });
  } catch (err) {
    console.error('Error cargando footer_panel:', err);
  }
}
