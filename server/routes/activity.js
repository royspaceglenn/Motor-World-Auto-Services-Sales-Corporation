import express from 'express';
import { getActivityLogs } from '../db/store.js';
import { logActivity } from '../services/activityLogger.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const limit = Number(req.query.limit || 100);
  const offset = Number(req.query.offset || 0);
  const userId = req.query.userId ? String(req.query.userId) : undefined;
  const actionType = req.query.actionType ? String(req.query.actionType) : undefined;
  return res.json(await getActivityLogs({ userId, limit, offset, actionType }));
});

router.post('/log', async (req, res) => {
  const actionType = String(req.body?.actionType || '').trim();
  if (!actionType) {
    return res.status(400).json({ error: 'actionType is required.' });
  }
  await logActivity(req.user.id, actionType, req.body?.metadata || {});
  return res.json({ success: true });
});

export default router;
