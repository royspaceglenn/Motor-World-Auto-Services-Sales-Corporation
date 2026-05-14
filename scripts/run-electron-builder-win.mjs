/**
 * Runs electron-builder to a fresh temp output dir (avoids "Access is denied"
 * when release/win-unpacked is locked), then copies artifacts into ./release.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const releaseDir = path.join(projectRoot, 'release');
const stopScript = path.join(projectRoot, 'scripts', 'stop-win-unpacked-locks.ps1');

const mode = process.argv[2];
if (mode !== '--dir' && mode !== '--nsis') {
  console.error('Usage: node scripts/run-electron-builder-win.mjs --dir|--nsis');
  process.exit(1);
}

const builderArgs = mode === '--dir' ? ['--win', '--dir'] : ['--win', 'nsis'];
const outBase = path.join(os.tmpdir(), `motor-world-electron-out-${Date.now()}`);

spawnSync(
  'powershell.exe',
  ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', stopScript],
  { cwd: projectRoot, stdio: 'inherit', shell: false },
);

const configArg = `-c.directories.output=${outBase}`;
const r = spawnSync(
  'npx',
  ['electron-builder', ...builderArgs, configArg],
  { cwd: projectRoot, stdio: 'inherit', shell: true },
);

if (r.status !== 0) {
  try {
    fs.rmSync(outBase, { recursive: true, force: true });
  } catch {
    // ignore
  }
  process.exit(r.status ?? 1);
}

fs.mkdirSync(releaseDir, { recursive: true });

const rmOpts = { recursive: true, force: true, maxRetries: 8, retryDelay: 250 };

for (const name of fs.readdirSync(outBase)) {
  const from = path.join(outBase, name);
  const to = path.join(releaseDir, name);
  try {
    fs.rmSync(to, rmOpts);
    fs.cpSync(from, to, { recursive: true });
  } catch {
    const alt = path.join(releaseDir, `${name}-fresh-${Date.now()}`);
    console.warn(
      `\nCould not replace "${to}" (close the Motor World Auto Services & Sales Corporation desktop app and any Explorer window on that folder, then delete the old folder).\n` +
        `Copied this build to:\n  ${alt}\n`,
    );
    fs.cpSync(from, alt, { recursive: true });
  }
}

try {
  fs.rmSync(outBase, { recursive: true, force: true });
} catch {
  // ignore
}

console.log(`\nCopied build output to ${releaseDir}\n`);
