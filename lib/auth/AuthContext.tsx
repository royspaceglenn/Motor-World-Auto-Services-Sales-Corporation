import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setStoredToken, USE_FIRESTORE_ADMIN_DATA, type ApiUser } from '../api/adminData';
import { hasStoredAuthToken, HttpError } from '../api/client';
import { observeFirebaseAuth } from '../firebase/auth';
import { loginForFirebaseAuth, normalizeLocalLogin } from './adminLogin';

export type AuthUser = ApiUser;

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  /** Block UI only when REST mode and a token might be valid (session restore). Firebase paints immediately. */
  const [isLoading, setIsLoading] = useState(
    () => !USE_FIRESTORE_ADMIN_DATA && hasStoredAuthToken()
  );

  const refreshUser = useCallback(async () => {
    const maxAttempts = 6;
    const delayMs = 400;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await authApi.me();
        setUser(response.user);
        return;
      } catch (err) {
        if (err instanceof HttpError && err.status === 401) {
          if (!USE_FIRESTORE_ADMIN_DATA) {
            setStoredToken('');
          }
          setUser(null);
          return;
        }
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    setUser(null);
  }, []);

  useEffect(() => {
    if (USE_FIRESTORE_ADMIN_DATA) {
      setIsLoading(false);
      return observeFirebaseAuth(({ appUser }) => {
        setUser(appUser as AuthUser | null);
      });
    }
    if (!hasStoredAuthToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    void refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(
        USE_FIRESTORE_ADMIN_DATA ? loginForFirebaseAuth(email) : normalizeLocalLogin(email),
        password
      );
      setUser(response.user);
      if (!USE_FIRESTORE_ADMIN_DATA) {
        setStoredToken(response.token);
      }
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return {
        success: false,
        error: message,
      };
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    if (USE_FIRESTORE_ADMIN_DATA) {
      setUser(null);
      return;
    }
    void refreshUser();
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
