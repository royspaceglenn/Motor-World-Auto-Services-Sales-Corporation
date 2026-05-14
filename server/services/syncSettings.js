import fs from 'fs';
import path from 'path';

function defaultSettingsPath() {
  if (process.env.MOTOR_WORLD_SYNC_SETTINGS_PATH) {
    return process.env.MOTOR_WORLD_SYNC_SETTINGS_PATH;
  }
  if (process.env.EFCP_SYNC_SETTINGS_PATH) {
    return process.env.EFCP_SYNC_SETTINGS_PATH;
  }

  if (process.env.MOTOR_WORLD_APP_DATA_DIR) {
    return path.join(process.env.MOTOR_WORLD_APP_DATA_DIR, 'sync-settings.json');
  }
  if (process.env.EFCP_APP_DATA_DIR) {
    return path.join(process.env.EFCP_APP_DATA_DIR, 'sync-settings.json');
  }

  return '';
}

export function getSyncSettingsPath() {
  return defaultSettingsPath();
}

export function buildDefaultSyncSettings() {
  return {
    enabled: false,
    useFirebase: true,
    firebaseProjectId: '',
    firebaseShopId: 'main',
    firebaseServiceAccountJsonPath: '',
    syncIntervalSeconds: 30,
  };
}

export function ensureSyncSettingsFile() {
  const settingsPath = getSyncSettingsPath();
  if (!settingsPath) return '';

  const settingsDir = path.dirname(settingsPath);
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }

  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, `${JSON.stringify(buildDefaultSyncSettings(), null, 2)}\n`, 'utf8');
  }

  return settingsPath;
}

export function loadSyncSettings() {
  const settingsPath = getSyncSettingsPath();
  const defaults = buildDefaultSyncSettings();

  let fileSettings = {};
  if (settingsPath && fs.existsSync(settingsPath)) {
    try {
      fileSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
      fileSettings = {};
    }
  }

  return {
    ...defaults,
    ...fileSettings,
    enabled:
      process.env.FIREBASE_SYNC_ENABLED != null
        ? process.env.FIREBASE_SYNC_ENABLED === 'true'
        : (fileSettings.enabled ?? defaults.enabled),
    useFirebase:
      process.env.FIREBASE_SYNC_USE_FIREBASE != null
        ? process.env.FIREBASE_SYNC_USE_FIREBASE === 'true'
        : (fileSettings.useFirebase ?? defaults.useFirebase),
    firebaseProjectId:
      process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
      process.env.FIREBASE_PROJECT_ID?.trim() ||
      String(fileSettings.firebaseProjectId || defaults.firebaseProjectId).trim(),
    firebaseShopId:
      process.env.FIREBASE_VIEWER_SHOP_ID?.trim() ||
      process.env.VITE_FIREBASE_VIEWER_SHOP_ID?.trim() ||
      process.env.VITE_FIREBASE_SHOP_ID?.trim() ||
      String(fileSettings.firebaseShopId || defaults.firebaseShopId).trim(),
    firebaseServiceAccountJsonPath:
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
      String(fileSettings.firebaseServiceAccountJsonPath || defaults.firebaseServiceAccountJsonPath).trim(),
    syncIntervalSeconds: Number(
      process.env.FIREBASE_SYNC_INTERVAL_SECONDS ||
        fileSettings.syncIntervalSeconds ||
        defaults.syncIntervalSeconds
    ),
  };
}
