import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import activityRoutes from './routes/activity.js';
import notificationsRoutes from './routes/notifications.js';
import transactionsRoutes from './routes/transactions.js';
import itemsRoutes from './routes/items.js';
import soaRoutes from './routes/soa.js';
import loansRoutes from './routes/loans.js';
import personsRoutes from './routes/persons.js';
import vehiclesRoutes from './routes/vehicles.js';
import expensesRoutes from './routes/expenses.js';
import suppliersRoutes from './routes/suppliers.js';
import purchasesRoutes from './routes/purchases.js';
import paymentJournalRoutes from './routes/paymentJournal.js';
import documentArchivesRoutes from './routes/documentArchives.js';
import { warmDatabaseConnection } from './db/collectionsBackend.js';
import { ensureStoreInitialized } from './db/store.js';

dotenv.config();

function buildCorsOptions() {
  const raw = String(process.env.CORS_ORIGINS || '').trim();
  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  if (!raw) {
    if (isProd) {
      return { origin: false, credentials: true };
    }
    return { origin: true, credentials: true };
  }
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      return cb(null, list.includes(origin));
    },
    credentials: true,
  };
}

const app = express();

if (String(process.env.TRUST_PROXY || '') === '1' || String(process.env.TRUST_PROXY || '').toLowerCase() === 'true') {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors(buildCorsOptions()));
app.use(express.json());

/** Fast path for probes — no store init. */
app.get('/api/health', (req, res) => res.json({ ok: true }));

/** Neon / Postgres keep-warm (Vercel Cron). No full store seed — only connect + SELECT 1. */
app.get('/api/system/warm', async (req, res) => {
  try {
    await warmDatabaseConnection();
    return res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ ok: false, error: msg });
  }
});

app.use(async (req, res, next) => {
  try {
    await ensureStoreInitialized();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/activity', authMiddleware, activityRoutes);
app.use('/api/notifications', authMiddleware, notificationsRoutes);
app.use('/api/transactions', authMiddleware, transactionsRoutes);
app.use('/api/items', authMiddleware, itemsRoutes);
app.use('/api/soa', authMiddleware, soaRoutes);
app.use('/api/loans', authMiddleware, loansRoutes);
app.use('/api/persons', authMiddleware, personsRoutes);
app.use('/api/vehicles', authMiddleware, vehiclesRoutes);
app.use('/api/expenses', authMiddleware, expensesRoutes);
app.use('/api/suppliers', authMiddleware, suppliersRoutes);
app.use('/api/purchases', authMiddleware, purchasesRoutes);
app.use('/api/payment-journal', authMiddleware, paymentJournalRoutes);
app.use('/api/document-archives', authMiddleware, documentArchivesRoutes);

// Global error handler so 500 responses return JSON with error message
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const msg = (err && typeof err === 'object' && 'message' in err) ? String(err.message) : String(err || 'Unknown error');
  res.status(500).json({ error: msg });
});

export default app;
