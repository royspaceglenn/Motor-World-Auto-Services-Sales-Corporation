/**
 * Vercel serverless entry: runs the Express app so /api/* works on the same host as the Vite static build.
 * Store init runs on first real API request (see server/app.js), not here — so cold login is not blocked on full seed before the HTTP handler exists.
 */
import dotenv from 'dotenv';
import serverless from 'serverless-http';

dotenv.config({ quiet: true });

let handler;

function assertVercelHasPostgres() {
  if (String(process.env.EMERGENCY_BYPASS_DB || '').trim().toLowerCase() === 'true') return;
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
