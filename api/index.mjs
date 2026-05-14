/**
 * Vercel serverless entry: runs the Express app so /api/* works on the same host as the Vite static build.
 * Requires DATABASE_URL (Postgres) on Vercel — local SQLite is not suitable for serverless.
 */
import dotenv from 'dotenv';
import serverless from 'serverless-http';

dotenv.config();

let handler;

export default async function vercelApi(req, res) {
  try {
    if (!handler) {
      const { assertProductionSafe } = await import('../server/lib/productionEnv.js');
      assertProductionSafe();
      const { initializeStore } = await import('../server/db/store.js');
      await initializeStore();
      const { default: app } = await import('../server/app.js');
      handler = serverless(app);
    }
    return handler(req, res);
  } catch (err) {
    console.error('API bootstrap failed:', err);
    const msg = err instanceof Error ? err.message : String(err);
    if (!res.headersSent) {
      res.status(500).json({ error: msg });
    }
  }
}
