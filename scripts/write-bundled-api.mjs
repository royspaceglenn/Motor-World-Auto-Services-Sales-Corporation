/**
 * Writes electron/bundled-api.json so packaged installers use your shared API
 * (no api-settings.json on each PC — users only install and sign in).
 *
 * Usage:
 *   node scripts/write-bundled-api.mjs https://api.yourshop.com
 *   node scripts/write-bundled-api.mjs --clear
 *
 * Or set MOTOR_WORLD_PUBLIC_API_BASE (or EFCP_PUBLIC_API_BASE) and run with no URL argument.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dest = path.resolve(__dirname, '../electron/bundled-api.json');

const args = process.argv.slice(2);

if (args.includes('--clear') || args.includes('--local')) {
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest);
    console.log('Removed electron/bundled-api.json — installers use the local API on this computer.');
  } else {
    console.log('No bundled-api.json to remove.');
  }
  process.exit(0);
}

const urlArg = args.find((a) => !a.startsWith('--'));
const fromEnv = process.env.MOTOR_WORLD_PUBLIC_API_BASE?.trim() || process.env.EFCP_PUBLIC_API_BASE?.trim();
const raw = urlArg || fromEnv;

if (!raw) {
  console.error(`
Missing API URL.

  npm run desktop:installers:configure -- https://api.yourshop.com

Or:

  set MOTOR_WORLD_PUBLIC_API_BASE=https://api.yourshop.com
  npm run desktop:installers:configure

Then build installers:

  npm run desktop:build

Remove bundled URL (local-first installers again):

  node scripts/write-bundled-api.mjs --clear
`);
  process.exit(1);
}

let normalized = raw.trim().replace(/\/$/, '');
if (!/^https?:\/\//i.test(normalized)) {
  normalized = `https://${normalized}`;
}

try {
  const { hostname } = new URL(normalized);
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.error('Use a real server hostname for shared installers, not localhost.');
    process.exit(1);
  }
} catch {
  console.error('Invalid URL:', raw);
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, `${JSON.stringify({ apiBaseUrl: normalized }, null, 2)}\n`);
console.log('Wrote', dest);
console.log('  apiBaseUrl:', normalized);
console.log('Next: npm run desktop:build   (or desktop:pack)');
