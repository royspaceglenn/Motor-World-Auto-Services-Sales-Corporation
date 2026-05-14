/** Canonical REST admin email (stored in SQLite / Postgres `users.email`). */
export const DEFAULT_REST_ADMIN_EMAIL = 'admin@motorworldcorp.com';

/** Legacy login id kept as an alias for {@link DEFAULT_REST_ADMIN_EMAIL}. */
export const SINGLE_ADMIN_USERNAME = 'admin';

/** Firebase Auth requires an email-shaped identifier (see `scripts/seed-firebase-users.mjs`). */
export const FIREBASE_SIGNIN_EMAIL = 'admin@motorworldcorp.com';

export function normalizeLocalLogin(raw: string): string {
  const t = String(raw || '').trim().toLowerCase();
  if (t === SINGLE_ADMIN_USERNAME || t === FIREBASE_SIGNIN_EMAIL.toLowerCase() || t === 'admin@efcp.com') {
    return DEFAULT_REST_ADMIN_EMAIL;
  }
  return t;
}

export function loginForFirebaseAuth(raw: string): string {
  const t = String(raw || '').trim().toLowerCase();
  if (t === SINGLE_ADMIN_USERNAME || t === FIREBASE_SIGNIN_EMAIL.toLowerCase()) return FIREBASE_SIGNIN_EMAIL;
  if (t === DEFAULT_REST_ADMIN_EMAIL) return DEFAULT_REST_ADMIN_EMAIL;
  return t.includes('@') ? t : `${t}@motorworldcorp.com`;
}
