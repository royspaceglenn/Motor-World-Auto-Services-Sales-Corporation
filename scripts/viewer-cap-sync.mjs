import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist-viewer');
const viewerHtml = path.join(dist, 'viewer.html');
const indexHtml = path.join(dist, 'index.html');

if (!fs.existsSync(viewerHtml)) {
  console.error('viewer-cap-sync: missing', viewerHtml, '(run vite build --config vite.viewer.config.ts first)');
  process.exit(1);
}

fs.copyFileSync(viewerHtml, indexHtml);

const manifestPath = path.join(dist, 'viewer.webmanifest');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.start_url = './index.html';
  manifest.id = './index.html';
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log('viewer-cap-sync: wrote index.html + updated viewer.webmanifest for Capacitor');
