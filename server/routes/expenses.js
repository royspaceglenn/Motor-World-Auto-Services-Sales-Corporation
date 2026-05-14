import express from 'express';
import { requireAdmin } from '../middleware/rbac.js';
import { createExpense, getExpenses } from '../db/store.js';
import { logActivity } from '../services/activityLogger.js';
import { notifyAdminsAboutAction } from '../services/notificationService.js';
import { scheduleViewerSync } from '../services/firebaseViewerSync.js';

const router = express.Router();

router.get('/', async (req, res) => {
  return res.json({
    expenses: await getExpenses({
      category: req.query.category ? String(req.query.category) : undefined,
      fromDate: req.query.fromDate ? String(req.query.fromDate) : undefined,
      toDate: req.query.toDate ? String(req.query.toDate) : undefined,
    }),
  });
});

router.post('/', requireAdmin, async (req, res) => {
  const title = String(req.body?.title || '').trim();
  const amount = Number(req.body?.amount || 0);
  if (!title || amount <= 0) {
    return res.status(400).json({ error: 'Title and positive amount are required.' });
  }
  const created = await createExpense({
    ...req.body,
    recordedBy: req.user.displayName,
    recordedByUserId: req.user.id,
  });
  await logActivity(req.user.id, 'ADD_EXPENSE', { expenseId: created.id, title: created.title, amount: created.amount });
  await notifyAdminsAboutAction(req.user, 'ADD_EXPENSE', `recorded expense: ${created.title}`);
  scheduleViewerSync();
  return res.status(201).json(created);
});

export default router;
