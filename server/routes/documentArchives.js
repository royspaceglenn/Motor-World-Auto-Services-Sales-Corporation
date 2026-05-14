import express from 'express';
import { requireAdmin } from '../middleware/rbac.js';
import {
  getDocumentArchiveById,
  getTransactionById,
  listDocumentArchives,
  updateDocumentArchiveSnapshot,
  upsertDocumentArchivesForRelease,
} from '../db/store.js';
import { logActivity } from '../services/activityLogger.js';
import { scheduleViewerSync } from '../services/firebaseViewerSync.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '');
    const kind = String(req.query.kind || '');
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');
    const transactionId = String(req.query.transactionId || '');
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
    const offset = Math.max(0, Number(req.query.offset || 0));
    const result = await listDocumentArchives({ q, kind, from, to, transactionId, limit, offset });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to list archives.' });
  }
});

router.post('/sync-transaction/:transactionId', requireAdmin, async (req, res) => {
  try {
    const transactionId = String(req.params.transactionId || '').trim();
    const tx = await getTransactionById(transactionId);
    if (!tx || tx.type !== 'RELEASE') {
      return res.status(400).json({ error: 'RELEASE transaction not found.' });
    }
    const soaId = req.body?.soaId != null ? String(req.body.soaId) : null;
    await upsertDocumentArchivesForRelease(tx, req.user.id, { soaId });
    await logActivity(req.user.id, 'DOCUMENT_ARCHIVE_SYNC', { transactionId });
    scheduleViewerSync();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to sync archives.' });
  }
});

router.get('/:id', async (req, res) => {
  const doc = await getDocumentArchiveById(String(req.params.id || '').trim());
  if (!doc) return res.status(404).json({ error: 'Archive entry not found.' });
  return res.json(doc);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const existing = await getDocumentArchiveById(id);
    if (!existing) return res.status(404).json({ error: 'Archive entry not found.' });
    const snap = req.body?.transactionSnapshot;
    if (snap != null && typeof snap !== 'object') {
      return res.status(400).json({ error: 'transactionSnapshot must be an object.' });
    }
    const editNote = req.body?.editNote != null ? String(req.body.editNote) : undefined;
    const updated = await updateDocumentArchiveSnapshot(id, { transactionSnapshot: snap, editNote }, req.user.id);
    await logActivity(req.user.id, 'DOCUMENT_ARCHIVE_EDIT', {
      archiveId: id,
      transactionId: existing.transactionId,
      kind: existing.kind,
      editNote: editNote ?? null,
    });
    scheduleViewerSync();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to update archive.' });
  }
});

export default router;
