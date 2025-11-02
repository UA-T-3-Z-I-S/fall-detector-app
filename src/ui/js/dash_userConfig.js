// userConfig.js
export function initUserConfigModal() {
  const modal = document.getElementById('config-modal');
  const closeBtn = document.getElementById('close-config');
  const saveBtn = document.getElementById('save-config');
  const userInput = document.getElementById('cfg-username');
  const passInput = document.getElementById('cfg-password');
  const togglePassBtn = document.getElementById('toggle-pass');
  const openConfigBtn = document.getElementById('open-config-btn');

  openConfigBtn.addEventListener('click', async () => {
    const res = await window.api.readUserConfig();
    if (res.ok) {
      userInput.value = res.config.username || '';
      passInput.value = '';
    }
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  togglePassBtn.addEventListener('click', () => {
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
    togglePassBtn.textContent = passInput.type === 'password' ? '👁️' : '🙈';
  });

  saveBtn.addEventListener('click', async () => {
    const username = userInput.value.trim();
    const password = passInput.value.trim();
    if (!username && !password) {
      alert('Debes ingresar al menos un campo para cambiar.');
      return;
    }

    const res = await window.api.updateUserConfig(username, password);
    if (!res.ok) return alert('Error guardando cambios: ' + res.error);

    alert('✅ Usuario actualizado. Cerrando sesión...');
    modal.classList.add('hidden');
    setTimeout(async () => await window.api.logout(), 500);
  });
}
