import React, { useMemo, useState } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { DEFAULT_REST_ADMIN_EMAIL } from '../lib/auth/adminLogin';
import { USE_FIRESTORE_ADMIN_DATA } from '../lib/api/adminData';
import { COMPANY_DISPLAY_NAME } from '../lib/company';
import { User, Lock, Smartphone, ArrowRight, Shield } from 'lucide-react';
import { Button } from './ui/Button';
import { DashboardSurface } from './ui/DashboardPrimitives';

function remoteApiDisplayLine(): string | null {
  const raw =
    (typeof window !== 'undefined' &&
      (window.motorWorldDesktop?.apiBaseUrl || window.efcpDesktop?.apiBaseUrl)) ||
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    '';
  const base = String(raw).replace(/\/$/, '').trim();
  if (!base) return null;
  try {
    const u = new URL(base.startsWith('http') ? base : `https://${base}`);
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') return null;
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const serverLine = useMemo(() => remoteApiDisplayLine(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.success) return;
    setError(result.error ?? 'Login failed.');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(196,181,253,0.38),_rgba(248,250,252,1)_38%,_rgba(224,231,255,0.3)_100%)] p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <DashboardSurface tone="dark" className="overflow-hidden p-6 sm:p-8">
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 shadow-[0_22px_35px_-24px_rgba(129,140,248,0.9)]">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">Official application</p>
                  <h1 className="text-xl font-semibold text-white">{COMPANY_DISPLAY_NAME}</h1>
                </div>
              </div>

              <div className="mt-10 max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">Operations Workspace</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                  Modern inventory, purchasing, POS, and viewer access in one coordinated system.
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  The admin dashboard now shares the same design language as the standalone phone viewer, so both sides feel like one product.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-slate-600 bg-slate-800/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">Core modules</p>
                  <p className="mt-2 text-sm text-slate-200">Inventory, purchasing, history, accounts, receivables, and expenses.</p>
                </div>
                <div className="rounded-[24px] border border-slate-600 bg-slate-800/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">Phone access</p>
                  <p className="mt-2 text-sm text-slate-200">Open the standalone viewer for quick read-only access on mobile.</p>
                </div>
              </div>

              <a
                href="viewer.html"
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
              >
                <Smartphone className="h-4 w-4" />
                Open mobile viewer
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </DashboardSurface>

          <DashboardSurface className="p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">Sign in</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-600">
                {USE_FIRESTORE_ADMIN_DATA
                  ? 'Sign in with the Firebase email and password your administrator configured.'
                  : 'Sign in with the username and password stored on your Motor World server (JWT session).'}
              </p>
              {serverLine && (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  This copy is set up for your organization&apos;s server{' '}
                  <span className="font-mono text-[11px] text-slate-700">{serverLine}</span>. Use the credentials your
                  administrator gave you.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Email address"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">Help</p>
              {USE_FIRESTORE_ADMIN_DATA ? (
                <p className="text-xs text-slate-500">
                  Use the Firebase email and password your administrator assigned.
                </p>
              ) : import.meta.env.DEV ? (
                <p className="text-xs text-slate-500">
                  Local seed user: <span className="font-mono text-slate-800">{DEFAULT_REST_ADMIN_EMAIL}</span>. Default
                  password is documented in <span className="font-mono">server/README.md</span> (not shown in production
                  builds).
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Use the account your administrator created. If you cannot sign in, ask an admin to verify your user or
                  reset your password.
                </p>
              )}
            </div>
          </DashboardSurface>
        </div>
      </div>
    </div>
  );
};
