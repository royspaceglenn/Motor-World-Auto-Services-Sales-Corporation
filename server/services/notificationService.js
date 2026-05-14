import {
  addNotification,
  getUsers,
  hasRecentDuplicateNotification,
} from '../db/store.js';

function actorLabel(user) {
  if (!user) return 'System';
  return user.displayName || user.display_name || user.email || 'System';
}

export async function createNotification(sourceUserId, actionType, message) {
  if (!sourceUserId || !actionType || !message) return null;
  if (await hasRecentDuplicateNotification(sourceUserId, actionType, message)) return null;
  return addNotification({
    source_user_id: sourceUserId,
    action_type: actionType,
    message,
    read: 0,
  });
}

export async function notifyAdminsAboutAction(user, actionType, detail) {
  const actors = (await getUsers()).filter((entry) => entry.role === 'overseer' || entry.role === 'admin');
  if (actors.length === 0) return null;
  return createNotification(user?.id || null, actionType, `${actorLabel(user)} ${detail}`);
}
