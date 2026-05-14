import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Viewer-only production bundle for Capacitor (`dist-viewer/`). */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'dist-viewer',
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'viewer.html'),
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@google/genai': path.resolve(__dirname, 'node_modules/@google/genai/dist/web/index.mjs'),
      },
    },
  };
});
