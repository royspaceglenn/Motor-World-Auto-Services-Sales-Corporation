import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './lib/auth/AuthContext';
import { AppGate } from './components/AppGate';
import { RootErrorBoundary } from './components/RootErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </RootErrorBoundary>
  </React.StrictMode>,
);