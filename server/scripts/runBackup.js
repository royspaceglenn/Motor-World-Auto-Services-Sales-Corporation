import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const backupsDir = path.join(__dirname, '..', 'backups');

/**
 * Timestamp for backup folder name (safe for filenames: no colons).
 * @returns {string} e.g. "2026-02-22T143052"
 */
function backupTimestamp() {
  return new Date().toISOString().slice(0, 19).replace(/:/g, '');
}

/**
 * Copies all .json files from server/data/ to server/backups/<timestamp>/.
 * Call this on server start (and optionally on a schedule).
 * @returns {Promise<{ backupId: string, files: string[] }>}
 */
export async function runBackup() {
  await fs.mkdir(backupsDir, { recursive: true });
  const backupId = backupTimestamp();
  const backupPath = path.join(backupsDir, backupId);
  await fs.mkdir(backupPath, { recursive: true });

  await fs.mkdir(dataDir, { recursive: true });
  const entries = await fs.readdir(dataDir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && e.name.endsWith('.json')).map((e) => e.name);
  for (const name of files) {
    const src = path.join(dataDir, name);
    const dest = path.join(backupPath, name);
    await fs.copyFile(src, dest);
  }
  return { backupId, files };
}
