export async function initCameraPanel() {
  const res = await fetch('./ui/components/camera_panel.html');
  const html = await res.text();
  const container = document.getElementById('camera-container');
  container.innerHTML = html;

  const feed = document.querySelector('.camera-feed');
  const placeholder = document.getElementById('cam-placeholder');
  const labelEl = document.querySelector('.camera-label');

  let running = true;

  async function updateCameraLabel() {
    try {
      const resp = await fetch('http://localhost:8081/cam/info', { cache: 'no-store' });
      const data = await resp.json();
      labelEl.textContent = data.camera_name || 'Cámara sin nombre';
    } catch {
      labelEl.textContent = 'Cámara desconocida';
    }
  }

  await updateCameraLabel();
  setInterval(updateCameraLabel, 5000);

  const canvas = document.getElementById('overlay-canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  const modal = document.getElementById('cam-config-modal');
  const cfgName = document.getElementById('cfg-camera-name');
  const cfgUrl = document.getElementById('cfg-camera-url');
  const btnSettings = document.getElementById('cam-settings-btn');

  btnSettings.addEventListener('click', async () => {
    try {
      const resp = await fetch('http://localhost:8081/cam/info');
      const data = await resp.json();
      cfgName.value = data.camera_name ?? "";
      cfgUrl.value = data.live_url ?? "";
    } catch {}
    modal.style.display = 'flex';
  });

  document.getElementById('cfg-cancel').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('cfg-save').addEventListener('click', async () => {
    running = false;
    canvas.style.display = "none";
    placeholder.textContent = "♻️ Reiniciando cámara...";
    placeholder.style.display = "flex";

    await fetch('http://localhost:8081/cam/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camera_name: cfgName.value,
        camera_url: cfgUrl.value
      })
    });

    modal.style.display = 'none';

    setTimeout(() => {
      updateCameraLabel();
      running = true;
      canvas.style.display = "block";
      fetchFrames();
    }, 2000);
  });

  async function fetchFrames() {
    while (running) {
      try {
        const resp = await fetch('http://localhost:8081/frame.jpg', { cache: 'no-store' });
        if (!resp.ok) throw new Error();

        const blob = await resp.blob();
        const img = await createImageBitmap(blob);

        placeholder.style.display = 'none';

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        img.close?.(); // evitar leaks en Electron
      } catch {
        placeholder.textContent = "⚠️ Cámara no disponible";
        placeholder.style.display = 'flex';
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  fetchFrames();
}
