import express from 'express';
import { requireAdmin } from '../middleware/rbac.js';
import { addSoaPayment, getSoaById, getSoaByTransactionId, getTransactionById, updateSoaPaymentStatus, updateSoaRecord, upsertDocumentArchivesForRelease } from '../db/store.js';
import { logActivity } from '../services/activityLogger.js';
import { notifyAdminsAboutAction } from '../services/notificationService.js';
import { scheduleViewerSync } from '../services/firebaseViewerSync.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const transactionId = String(req.query.transactionId || '').trim();
  if (!transactionId) {
    return res.status(400).json({ error: 'transactionId is required.' });
  }
  const soa = await getSoaByTransactionId(transactionId);
  if (!soa) return res.status(404).json({ error: 'Statement of Account not found.' });
  return res.json(soa);
});

router.get('/:id', async (req, res) => {
  const soa = await getSoaById(req.params.id);
  if (!soa) return res.status(404).json({ error: 'Statement of Account not found.' });
  return res.json(soa);
});

router.patch('/:id/record', requireAdmin, async (req, res) => {
  try {
    const existing = await getSoaById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Statement of Account not found.' });
    const b = req.body || {};
    const updated = await updateSoaRecord(req.params.id, {
      customerName: b.customerName,
      itemName: b.itemName,
      dueDate: b.dueDate,
    });
    if (!updated) return res.status(404).json({ error: 'Statement of Account not found.' });
    await logActivity(req.user.id, 'EDIT_SOA_RECORD', {
      soaId: updated.id,
      transactionId: updated.transactionId,
      before: {
        customerName: existing.customerName,
        itemName: existing.itemName,
        dueDate: existing.dueDate,
      },
      after: {
        customerName: updated.customerName,
        itemName: updated.itemName,
        dueDate: updated.dueDate,
      },
    });
    const tx = await getTransactionById(updated.transactionId);
    if (tx && tx.type === 'RELEASE') {
      await upsertDocumentArchivesForRelease(tx, req.user.id, { soaId: updated.id });
    }
    await notifyAdminsAboutAction(req.user, 'EDIT_SOA_RECORD', `updated billing record for ${updated.customerName}`);
    scheduleViewerSync();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to update SOA.' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const paymentStatus = String(req.body?.paymentStatus || '').trim();
  if (!paymentStatus) return res.status(400).json({ error: 'paymentStatus is required.' });
  const updated = await updateSoaPaymentStatus(req.params.id, paymentStatus);
  if (!updated) return res.status(404).json({ error: 'Statement of Account not found.' });
  await logActivity(req.user.id, 'UPDATE_SOA_STATUS', { soaId: updated.id, paymentStatus });
  await notifyAdminsAboutAction(req.user, 'UPDATE_SOA_STATUS', `updated SOA status for ${updated.customerName}`);
  return res.json(updated);
});

router.post('/:id/payments', requireAdmin, async (req, res) => {
  const amount = Number(req.body?.amount || 0);
  if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero.' });
  const soa = await addSoaPayment(req.params.id, req.body);
  if (!soa) return res.status(404).json({ error: 'Statement of Account not found.' });
  await logActivity(req.user.id, 'ADD_SOA_PAYMENT', { soaId: soa.id, amount });
  await notifyAdminsAboutAction(req.user, 'ADD_SOA_PAYMENT', `recorded SOA payment for ${soa.customerName}`);
  return res.json({ soa });
});

export default router;
