import express from 'express';
import { requireAdmin } from '../middleware/rbac.js';
import { createPerson, deletePerson, getPersonById, getPersons, updatePerson } from '../db/store.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  return res.json({ persons: await getPersons() });
});

router.get('/:id', async (req, res) => {
  const person = await getPersonById(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found.' });
  return res.json({ person });
});

router.post('/', requireAdmin, async (req, res) => {
  const fullName = String(req.body?.fullName || '').trim();
  if (!fullName) return res.status(400).json({ error: 'Full name is required.' });
  return res.status(201).json(await createPerson(req.body));
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const updated = await updatePerson(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Person not found.' });
  return res.json(updated);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await deletePerson(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error?.message || 'Failed to delete person.' });
  }
});

export default router;
