/**
 * Vercel serverless entry: runs the Express app so /api/* works on the same host as the Vite static build.
 * On Vercel, DATABASE_URL (Postgres) is required — SQLite cannot write under /var/task.
 */
import dotenv from 'dotenv';
import serverless from 'serverless-http';

dotenv.config();

let handler;

function assertVercelHasPostgres() {
  if (String(process.env.VERCEL || '').trim() !== '1') return;
  if (String(process.env.DATABASE_URL || '').trim()) return;
  throw new Error(
    '[motor-world] On Vercel you must set DATABASE_URL (PostgreSQL). The serverless filesystem cannot create server/data for SQLite. ' +
      'Use Neon, Supabase, Vercel Postgres, or another Postgres host, then add DATABASE_URL in Project Settings → Environment Variables.'
  );
}

export default async function vercelApi(req, res) {
  try {
    if (!handler) {
      assertVercelHasPostgres();
      const { assertProductionSafe } = await import('../server/lib/productionEnv.js');
      assertProductionSafe();
      const [{ initializeStore }, { default: app }] = await Promise.all([
        import('../server/db/store.js'),
        import('../server/app.js'),
      ]);
      await initializeStore();
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
