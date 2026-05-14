export const DEFAULT_REST_ADMIN_EMAIL = 'admin@motorworldcorp.com';

export const DEFAULT_REST_ADMIN_PASSWORD = 'maoningpassword';

export const SINGLE_ADMIN_USERNAME = 'admin';

export const FIREBASE_SIGNIN_EMAIL = 'admin@efcp.com';

export function normalizeLocalLogin(raw) {
  const t = String(raw || '').trim().toLowerCase();
  if (t === SINGLE_ADMIN_USERNAME || t === FIREBASE_SIGNIN_EMAIL.toLowerCase() || t === 'admin@efcp.com') {
    return DEFAULT_REST_ADMIN_EMAIL;
  }
  return t;
}
