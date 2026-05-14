import express from 'express';
import bcrypt from 'bcryptjs';
import { createUser, deleteUser, getUserByEmail, getUsers, updateUser } from '../db/store.js';
import { requireAdmin } from '../middleware/rbac.js';
import { logActivity } from '../services/activityLogger.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const users = (await getUsers())
    .map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role === 'overseer' ? 'admin' : user.role,
      createdAt: user.created_at,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  return res.json({ users });
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const displayName = String(req.body?.displayName || '').trim();
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required.' });
    }
    if (await getUserByEmail(email)) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    const created = await createUser({
      email,
      password_hash: await bcrypt.hash(password, 10),
      display_name: displayName,
      role: 'admin',
    });
    await logActivity(req.user.id, 'CREATE_USER', { email, role: 'admin' });
    return res.status(201).json({
      user: {
        id: created.id,
        email: created.email,
        displayName: created.display_name,
        role: created.role,
        createdAt: created.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to create user.' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const targetId = req.params.id;
    const users = await getUsers();
    const target = users.find((user) => user.id === targetId);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    const hasDisplay = req.body?.displayName !== undefined;
    const hasPassword = req.body?.password !== undefined;
    if (!hasDisplay && !hasPassword) {
      return res.status(400).json({ error: 'Send displayName and/or password to update.' });
    }

    const patch = {};
    if (hasDisplay) {
      const displayName = String(req.body.displayName || '').trim();
      if (!displayName) {
        return res.status(400).json({ error: 'Display name cannot be empty.' });
      }
      patch.display_name = displayName;
    }
    if (hasPassword) {
      const password = String(req.body.password || '');
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }
      patch.password_hash = await bcrypt.hash(password, 10);
    }

    const updated = await updateUser(targetId, patch);
    if (!updated) return res.status(404).json({ error: 'User not found.' });
    await logActivity(req.user.id, 'UPDATE_USER', {
      targetUserId: updated.id,
      displayName: patch.display_name,
      passwordReset: Boolean(patch.password_hash),
    });
    return res.json({
      user: {
        id: updated.id,
        email: updated.email,
        displayName: updated.display_name,
        role: updated.role,
        createdAt: updated.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Failed to update user.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const users = await getUsers();
  const target = users.find((user) => user.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  if (users.length <= 1) {
    return res.status(400).json({ error: 'Cannot delete the only account.' });
  }
  await deleteUser(target.id);
  await logActivity(req.user.id, 'DELETE_USER', { targetUserId: target.id, email: target.email });
  return res.json({ success: true });
});

export default router;
