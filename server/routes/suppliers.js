import express from 'express';
import { requireAdmin } from '../middleware/rbac.js';
import {
  createSupplier,
  deleteSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier,
} from '../db/store.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  return res.json({ suppliers: await getSuppliers() });
});

router.get('/:id', async (req, res) => {
  const supplier = await getSupplierById(req.params.id);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found.' });
  return res.json({ supplier });
});

router.post('/', requireAdmin, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Supplier name is required.' });
  return res.status(201).json(await createSupplier(req.body));
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const updated = await updateSupplier(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Supplier not found.' });
  return res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await deleteSupplier(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error?.message || 'Failed to delete supplier.' });
  }
});

export default router;
