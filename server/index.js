import dotenv from 'dotenv';
import { pathToFileURL } from 'url';
import app from './app.js';
import { initializeStore } from './db/store.js';
import { closeCollectionsBackend } from './db/collectionsBackend.js';
import { scheduleViewerSync, startViewerSyncLoop, stopViewerSyncLoop } from './services/firebaseViewerSync.js';
import { assertProductionSafe } from './lib/productionEnv.js';

let serverInstance = null;

export async function startServer(options = {}) {
  dotenv.config();
  assertProductionSafe();

  if (serverInstance) {
    return serverInstance;
  }

  await initializeStore();

  const port = Number(options.port || process.env.PORT || 3001);
  serverInstance = app.listen(port, () => {
    console.log(`Motor World backend listening on port ${port}`);
    startViewerSyncLoop();
    scheduleViewerSync();
  });

  return serverInstance;
}

export function stopServer() {
  return new Promise((resolve, reject) => {
    if (!serverInstance) {
      resolve();
      return;
    }

    const activeServer = serverInstance;
    serverInstance = null;
    stopViewerSyncLoop();
    activeServer.close(async (error) => {
      if (error) {
        reject(error);
        return;
      }
      try {
        await closeCollectionsBackend();
      } catch {
        // ignore pool shutdown errors
      }
      resolve();
    });
  });
}

const entryHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === entryHref) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
