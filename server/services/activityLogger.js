import { addActivityLog } from '../db/store.js';

export async function logActivity(userId, actionType, metadata = {}) {
  if (!userId || !actionType) return null;
  return addActivityLog({
    user_id: userId,
    action_type: actionType,
    metadata,
  });
}
