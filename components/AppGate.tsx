import React from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { Login } from './Login';
import App from '../App';
import { USE_FIRESTORE_ADMIN_DATA } from '../lib/api/adminData';

/**
 * Firebase: email/password via Firebase Auth.
 * REST API: JWT login — no valid session shows the sign-in screen (API must allow `/api/auth/login`).
 */
export const AppGate: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (USE_FIRESTORE_ADMIN_DATA) {
    return isAuthenticated ? <App /> : <Login />;
  }

  if (!user) {
    return <Login />;
  }

  return <App />;
};
