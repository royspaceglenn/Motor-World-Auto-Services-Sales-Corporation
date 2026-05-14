import jwt from 'jsonwebtoken';
import { getPrimaryUserForSession, getUserById, mapUserToSession } from '../db/store.js';

function readToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

export async function authMiddleware(req, res, next) {
  const token = readToken(req);
  if (!token) {
    const allowAnonymous = String(process.env.ALLOW_UNAUTHENTICATED_API || '').toLowerCase() === 'true';
    if (!allowAnonymous) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const sessionUser = await getPrimaryUserForSession();
    if (!sessionUser) {
      return res.status(503).json({ error: 'No local user account is configured yet.' });
    }
    req.user = sessionUser;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await getUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Account no longer exists.' });
    req.user = mapUserToSession(user);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}