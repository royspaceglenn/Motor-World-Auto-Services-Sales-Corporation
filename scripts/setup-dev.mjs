/**
 * One-shot local dev setup (like "clone → restore → run" on a .NET POS):
 * - Creates .env from .env.example if missing
 * - npm install at repo root and in server/
 * - Runs the sqlite hook script (no-op; API uses Node built-in node:sqlite)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = path.join(root, 'server');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

function runNpm(args, cwd) {
  const r = spawnSync('npm', args, { cwd, stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('Created .env from .env.example — edit values if you use Firebase or a remote API.\n');
}

console.log('npm install (project root)…\n');
runNpm(['install'], root);

console.log('\nnpm install (server/)…\n');
runNpm(['install'], serverDir);

console.log('\nSQLite / native hook (no-op with node:sqlite)…\n');
runNpm(['run', 'rebuild:server-sqlite'], root);

console.log(`
Setup finished.

Next (run only from the folder that already contains package.json — e.g. "sir Pedit\\\\efcp"):
  npm run desktop:start

Do not run "cd efcp" if you are already inside the efcp folder (that would look for efcp\\\\efcp and fail).

If the UI looks like an old build (wrong login text):
  - Use this dev command, not release\\\\win-unpacked\\\\EFCP-MotorParts.exe (that exe uses last "npm run build" output).
  - Or run: npm run cache:clean   then   npm run desktop:start
`);

