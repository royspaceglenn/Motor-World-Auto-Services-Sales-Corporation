const { contextBridge, ipcRenderer } = require('electron');

const apiBaseUrl =
  (process.env.MOTOR_WORLD_API_BASE_URL && String(process.env.MOTOR_WORLD_API_BASE_URL).trim().replace(/\/$/, '')) ||
  (process.env.EFCP_API_BASE_URL && String(process.env.EFCP_API_BASE_URL).trim().replace(/\/$/, '')) ||
  'http://127.0.0.1:3001';

contextBridge.exposeInMainWorld('motorWorldDesktop', {
  apiBaseUrl,
  isDesktopApp: true,
  openViewer: () => ipcRenderer.invoke('desktop:open-viewer'),
});
