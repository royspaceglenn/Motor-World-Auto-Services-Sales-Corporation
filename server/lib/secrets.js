/**
 * One place for signing keys and browser-origin config.
 *
 * Prefer these names (easier to remember than generic JWT/CORS names):
 * - MOTOR_WORLD_APP_SECRET — long random string (≥32 chars) used to sign login tokens
 * - MOTOR_WORLD_ORIGINS — comma-separated site URLs allowed to call the API
 *
 * Legacy aliases still work: JWT_SECRET, CORS_ORIGINS
 */

export function getAppSigningSecret() {
  return String(process.env.MOTOR_WORLD_APP_SECRET || process.env.JWT_SECRET || '').trim();
}

/** Used to sign/verify tokens. Non-production may fall back to dev default. */
export function getAppSigningSecretForTokens() {
  const s = getAppSigningSecret();
  if (s) return s;
  if (String(process.env.NODE_ENV || '').toLowerCase() !== 'production') {
    return 'dev-secret';
  }
  return '';
}

export function getWebOriginsRaw() {
  return String(
    process.env.MOTOR_WORLD_ORIGINS ||
      process.env.MOTOR_WORLD_WEB_ORIGINS ||
      process.env.CORS_ORIGINS ||
      '',
  ).trim();
}
