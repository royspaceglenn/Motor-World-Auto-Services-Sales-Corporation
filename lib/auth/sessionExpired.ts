/**
 * Central handler for session expiry. API client calls notifySessionExpired() on 401;
 * AuthProvider registers a callback to show modal and logout.
 */
let handler: (() => void) | null = null;

export function setSessionExpiredHandler(cb: (() => void) | null): void {
  handler = cb;
}

export function notifySessionExpired(): void {
  handler?.();
}

/** Decode JWT payload without verifying (client-side expiry check). Returns exp in seconds or null. */
export function getTokenExpiry(token: string | null): number | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null): boolean {
  const exp = getTokenExpiry(token);
  if (exp == null) return true;
  return exp * 1000 < Date.now();
}
