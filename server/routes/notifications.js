import express from 'express';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../db/store.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const limit = Number(req.query.limit || 30);
  const offset = Number(req.query.offset || 0);
  const unreadOnly = String(req.query.unreadOnly || '') === 'true';
  return res.json(await getNotifications({ limit, offset, unreadOnly }));
});

router.post('/:id/read', async (req, res) => {
  const ok = await markNotificationRead(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Notification not found.' });
  return res.json({ success: true });
});

router.post('/read-all', async (_req, res) => {
  await markAllNotificationsRead();
  return res.json({ success: true });
});

export default router;
