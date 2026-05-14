import fs from 'fs/promises';
import path from 'path';

/**
 * Writes data to a temporary file then renames it to the target path (atomic write).
 * If the process crashes during write, the original file is left unchanged.
 * @param {string} filePath - Absolute or relative path to the final file (e.g. 'data/items.json')
 * @param {string} content - Raw string content to write (e.g. JSON.stringify(data))
 * @param {object} [options] - Optional { encoding, mode } for fs.writeFile
 * @returns {Promise<void>}
 */
export async function writeFileAtomic(filePath, content, options = {}) {
  const { encoding = 'utf8', mode } = options;
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmpPath = path.join(dir, `${base}.tmp`);

  await fs.mkdir(dir, { recursive: true });
  const writeOpts = { encoding };
  if (mode != null) writeOpts.mode = mode;
  await fs.writeFile(tmpPath, content, writeOpts);
  await fs.rename(tmpPath, filePath);
}
