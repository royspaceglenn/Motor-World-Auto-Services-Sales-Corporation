import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MobileViewerApp } from './components/MobileViewerApp';

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./viewer-sw.js').catch((error) => {
      console.error('Viewer service worker registration failed.', error);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <MobileViewerApp />
  </React.StrictMode>
);
