import express from 'express';
import { requireAdmin } from '../middleware/rbac.js';
import { createVehicle, deleteVehicle, getVehicleById, getVehicles, updateVehicle } from '../db/store.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const personId = req.query.personId ? String(req.query.personId) : undefined;
  return res.json({ vehicles: await getVehicles(personId) });
});

router.get('/:id', async (req, res) => {
  const vehicle = await getVehicleById(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });
  return res.json({ vehicle });
});

router.post('/', requireAdmin, async (req, res) => {
  const personId = String(req.body?.personId || '').trim();
  const plateNumber = String(req.body?.plateNumber || '').trim();
  if (!personId || !plateNumber) {
    return res.status(400).json({ error: 'personId and plateNumber are required.' });
  }
  return res.status(201).json(await createVehicle(req.body));
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const updated = await updateVehicle(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Vehicle not found.' });
  return res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await deleteVehicle(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error?.message || 'Failed to delete vehicle.' });
  }
});

export default router;
