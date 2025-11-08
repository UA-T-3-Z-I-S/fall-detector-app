function decodeBase64(str) {
  return Buffer.from(str, 'base64').toString('utf-8');
}

async function loadConfig() {
  const res = await window.api.readConfig();
  if (!res.ok) return;
  config = res.config;
  if (config.USER_LOGIN) {
    config.username = config.USER_LOGIN.username;
    config.password = decodeBase64(config.USER_LOGIN.password);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const info = document.getElementById('info');
  const errorEl = document.getElementById('error');
  const form = document.getElementById('loginForm');
  const toggleBtn = document.getElementById('togglePwd');
  const pwdInput = document.getElementById('password');
  const userInput = document.getElementById('username');

  // Cargar config (solo para mostrar info del usuario)
  try {
    const res = await window.api.readConfig();
    if (res.ok && res.config && res.config.username) {
      info.textContent = ``;
    } else {
      info.textContent = 'Configuración cargada (usuario no disponible)';
    }
  } catch {
    info.textContent = 'No se pudo cargar la configuración';
  }

  // Toggle mostrar/ocultar contraseña
  toggleBtn.addEventListener('click', () => {
    const type = pwdInput.type === 'password' ? 'text' : 'password';
    pwdInput.type = type;
    toggleBtn.textContent = type === 'password' ? 'Mostrar' : 'Ocultar';
  });

  // Envío del formulario -> validar con preload
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';
    const username = userInput.value.trim();
    const password = pwdInput.value;

    if (!username || !password) {
      errorEl.textContent = 'Completa usuario y contraseña';
      errorEl.style.display = 'block';
      return;
    }

    try {
      const res = await window.api.validateLogin(username, password);
      if (!res.ok) {
        errorEl.textContent = res.error || 'Error al validar';
        errorEl.style.display = 'block';
        return;
      }
      if (res.success) {
        // abrir dashboard
        window.api.openDashboard();
      } else {
        errorEl.textContent = 'Usuario o contraseña incorrectos';
        errorEl.style.display = 'block';
        // pequeña animación CSS si existe
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
      }
    } catch (err) {
      errorEl.textContent = 'Error interno al iniciar sesión';
      errorEl.style.display = 'block';
      console.error(err);
    }
  });
});
