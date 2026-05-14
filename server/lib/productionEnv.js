/**
 * Fail fast when the API is started with NODE_ENV=production but unsafe/missing settings.
 * Call after dotenv.config().
 */
export function assertProductionSafe() {
  if (String(process.env.NODE_ENV || '').toLowerCase() !== 'production') return;

  const secret = String(process.env.JWT_SECRET || '').trim();
  const weak = new Set(['', 'dev-secret', 'change-me', 'changeme']);
  if (weak.has(secret.toLowerCase()) || secret.length < 32) {
    throw new Error(
      '[efcp] Production requires JWT_SECRET: use a random value at least 32 characters (e.g. openssl rand -hex 32). ' +
        'Do not use dev-secret or change-me.'
    );
  }

  const cors = String(process.env.CORS_ORIGINS || '').trim();
  if (!cors) {
    throw new Error(
      '[efcp] Production requires CORS_ORIGINS: comma-separated browser origins allowed to call this API, ' +
        'e.g. CORS_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com'
    );
  }

  if (String(process.env.ALLOW_UNAUTHENTICATED_API || '').toLowerCase() === 'true') {
    console.warn(
      '[efcp] WARNING: ALLOW_UNAUTHENTICATED_API=true — any caller can impersonate the primary user. Never use on the public internet.'
    );
  }
}
