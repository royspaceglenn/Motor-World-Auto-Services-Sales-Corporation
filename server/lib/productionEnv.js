import { getAppSigningSecret, getWebOriginsRaw } from './secrets.js';

/**
 * Fail fast when the API is started with NODE_ENV=production but unsafe/missing settings.
 * Call after dotenv.config().
 */
export function assertProductionSafe() {
  if (String(process.env.NODE_ENV || '').toLowerCase() !== 'production') return;

  const secret = getAppSigningSecret();
  const weak = new Set(['', 'dev-secret', 'change-me', 'changeme']);
  if (weak.has(secret.toLowerCase()) || secret.length < 32) {
    throw new Error(
      '[motor-world] Production requires MOTOR_WORLD_APP_SECRET (or legacy JWT_SECRET): use a random value at least 32 characters (e.g. openssl rand -hex 32). ' +
        'Do not use dev-secret or change-me.'
    );
  }

  const cors = getWebOriginsRaw();
  if (!cors) {
    throw new Error(
      '[motor-world] Production requires MOTOR_WORLD_ORIGINS (or legacy CORS_ORIGINS): comma-separated browser origins allowed to call this API, ' +
        'e.g. MOTOR_WORLD_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com'
    );
  }

  if (String(process.env.ALLOW_UNAUTHENTICATED_API || '').toLowerCase() === 'true') {
    console.warn(
      '[motor-world] WARNING: ALLOW_UNAUTHENTICATED_API=true — any caller can impersonate the primary user. Never use on the public internet.'
    );
  }

  if (String(process.env.EMERGENCY_BYPASS_DB || '').trim().toLowerCase() === 'true') {
    console.warn(
      '[motor-world] WARNING: EMERGENCY_BYPASS_DB=true — no Postgres/SQLite persistence; writes are dropped. Remove as soon as the database is healthy.'
    );
  }
}
