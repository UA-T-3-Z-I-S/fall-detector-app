import { initTopbar } from './dash_topbar.js';
import { initCameraPanel } from './dash_camera.js';
import { initUserConfigModal } from './dash_userConfig.js';
import { initNotificationsPanel } from './dash_notifications.js';
import { initFooterPanel } from './dash_footer.js';

window.addEventListener('DOMContentLoaded', async () => {
  await initTopbar();
  await initCameraPanel();
  initUserConfigModal();
  await initNotificationsPanel();
  await initFooterPanel();
});
