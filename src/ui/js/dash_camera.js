export async function initCameraPanel() {
  const res = await fetch('./ui/components/camera_panel.html');
  const html = await res.text();
  const container = document.getElementById('camera-container');
  container.innerHTML = html;

  const feed = document.querySelector('.camera-feed');
  const placeholder = document.getElementById('cam-placeholder');
  const labelEl = document.querySelector('.camera-label');

  // 🔹 Función para leer el nombre de la cámara directamente desde el server
  async function updateCameraLabel() {
    try {
      const resp = await fetch('http://localhost:8081/cam/info', { cache: 'no-store' });
      if (!resp.ok) throw new Error('Error leyendo info cámara');
      const data = await resp.json();
      labelEl.textContent = data.camera_name || 'Cámara sin nombre';
    } catch {
      labelEl.textContent = 'Cámara desconocida';
    }
  }

  // Leer al inicio
  await updateCameraLabel();

  // Opcional: actualizar cada 5 segundos si el nombre cambia dinámicamente
  setInterval(updateCameraLabel, 5000);

  // Crear canvas dentro del feed
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  canvas.id = 'overlay-canvas';
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '5';
  canvas.style.pointerEvents = 'none';
  feed.style.position = 'relative';
  feed.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Ocultar placeholder
  placeholder.style.display = 'none';

  // Función para obtener frames continuamente
  async function fetchFrames() {
    while (true) {
      try {
        const resp = await fetch('http://localhost:8081/frame.jpg', { cache: 'no-store' });
        if (!resp.ok) throw new Error('Error descargando frame');
        const blob = await resp.blob();
        const img = await createImageBitmap(blob);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } catch (err) {
        console.warn('No se pudo cargar frame, reintentando...');
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }

  fetchFrames();
}
