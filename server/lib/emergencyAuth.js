/**
 * Disaster recovery: when Neon/Postgres is unreachable on Vercel, opt in with env vars so
 * the UI can load without any database I/O. Turn OFF as soon as the database is healthy.
 *
 * Required together:
 * - EMERGENCY_BYPASS_DB=true
 * - EMERGENCY_STATIC_LOGIN=true
 * - EMERGENCY_LOGIN_EMAIL=you@example.com
 * - EMERGENCY_LOGIN_PASSWORD=long-random-secret (plain text match — only over HTTPS; remove ASAP)
 */
export const EMERGENCY_USER_ID = 'emergency-static-admin';

export function isEmergencyDbBypass() {
  return String(process.env.EMERGENCY_BYPASS_DB || '').trim().toLowerCase() === 'true';
}

export function isEmergencyStaticLoginEnabled() {
  if (!isEmergencyDbBypass()) return false;
  return String(process.env.EMERGENCY_STATIC_LOGIN || '').trim().toLowerCase() === 'true';
}

/**
 * @returns {null | { id: string, email: string, display_name: string, role: string, password_hash: string }}
 */
export function tryEmergencyStaticCredentials(normalizedEmail, password) {
  if (!isEmergencyStaticLoginEnabled()) return null;
  const want = String(process.env.EMERGENCY_LOGIN_EMAIL || '').trim().toLowerCase();
  const pass = String(process.env.EMERGENCY_LOGIN_PASSWORD || '');
  if (!want || !pass) return null;
  if (normalizedEmail !== want) return null;
  if (password !== pass) return null;
  return {
    id: EMERGENCY_USER_ID,
    email: want,
    display_name: 'Administrator (emergency)',
    role: 'admin',
    password_hash: '',
  };
}
