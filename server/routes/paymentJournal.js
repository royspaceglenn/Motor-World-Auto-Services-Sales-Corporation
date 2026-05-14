import express from 'express';
import { getPaymentJournal } from '../db/store.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const limit = Number(req.query.limit || 200);
  const offset = Number(req.query.offset || 0);
  return res.json({ entries: await getPaymentJournal({ limit, offset }) });
});

export default router;
