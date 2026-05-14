import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteDir = path.join(root, 'node_modules', '.vite');
fs.rmSync(viteDir, { recursive: true, force: true });
console.log('Removed node_modules/.vite (Vite prebundle cache).');
