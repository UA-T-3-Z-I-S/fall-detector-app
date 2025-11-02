import { initTopbar } from './dash_topbar.js';
import { initCameraPanel } from './dash_camera.js';
import { initUserConfigModal } from './dash_userConfig.js';

window.addEventListener('DOMContentLoaded', async () => {
  await initTopbar();
  await initCameraPanel();
  initUserConfigModal();
});
