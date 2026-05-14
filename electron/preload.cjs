const { contextBridge, ipcRenderer } = require('electron');

const apiBaseUrl =
  (process.env.EFCP_API_BASE_URL && String(process.env.EFCP_API_BASE_URL).trim().replace(/\/$/, '')) ||
  'http://127.0.0.1:3001';

contextBridge.exposeInMainWorld('efcpDesktop', {
  apiBaseUrl,
  isDesktopApp: true,
  openViewer: () => ipcRenderer.invoke('desktop:open-viewer'),
});
