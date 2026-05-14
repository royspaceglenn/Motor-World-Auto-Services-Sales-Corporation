import React, { useEffect, useState } from 'react';
import { activityApi, usersApi, type ActivityLog, type ApiUser } from '../lib/api/adminData';
import { Calendar, User, Filter } from 'lucide-react';

interface ActivityLogViewProps {
  filterUserId: string | null;
  onFilterChange: (userId: string | null) => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ filterUserId, onFilterChange }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [admins, setAdmins] = useState<ApiUser[]>([]);
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      activityApi.list({
        userId: filterUserId ?? undefined,
        limit: 100,
        offset: 0,
        actionType: actionTypeFilter || undefined,
      }),
      usersApi.list().catch(() => ({ users: [] })),
    ])
      .then(([activityRes, usersRes]) => {
        if (cancelled) return;
        setLogs(activityRes.logs);
        setTotal(activityRes.total);
        setAdmins((usersRes.users || []).filter((u: ApiUser) => u.role === 'admin'));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [filterUserId, actionTypeFilter]);

  const parseMeta = (meta: ActivityLog['metadata']) => {
    if (meta == null) return {};
    if (typeof meta === 'object') return meta as Record<string, unknown>;
    try {
      return JSON.parse(String(meta)) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Activity Log</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Filter className="w-4 h-4 text-slate-500 shrink-0 mt-2 sm:mt-0" />
          <select
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500"
            value={filterUserId ?? 'all'}
            onChange={(e) => onFilterChange(e.target.value === 'all' ? null : e.target.value)}
          >
            <option value="all">All accounts</option>
            {admins.map((u) => (
              <option key={u.id} value={u.id}>{u.displayName}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500"
            value={actionTypeFilter}
            onChange={(e) => setActionTypeFilter(e.target.value)}
          >
            <option value="">All actions</option>
            <option value="RELEASE">POS / Release</option>
            <option value="CREATE_SOA">Create SOA</option>
            <option value="UPDATE_SOA_STATUS">SOA status</option>
            <option value="EDIT_SOA_RECORD">Edit SOA record</option>
            <option value="ADD_SOA_PAYMENT">SOA payment</option>
            <option value="ADD_ITEM">Add item</option>
            <option value="EDIT_POS_METADATA">Edit sale labels</option>
            <option value="DOCUMENT_ARCHIVE_EDIT">Document archive edit</option>
            <option value="DOCUMENT_ARCHIVE_SYNC">Document archive sync</option>
          </select>
        </div>
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-6 text-xs font-semibold uppercase text-slate-700">Time</th>
                  <th className="py-3 px-6 text-xs font-semibold uppercase text-slate-700">User</th>
                  <th className="py-3 px-6 text-xs font-semibold uppercase text-slate-700">Action</th>
                  <th className="py-3 px-6 text-xs font-semibold uppercase text-slate-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const meta = parseMeta(log.metadata);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-6 text-sm text-slate-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-6">
                        <div className="font-medium text-slate-800">{log.userDisplayName}</div>
                        <div className="text-xs text-slate-500">{log.userEmail}</div>
                      </td>
                      <td className="py-3 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm text-slate-600">
                        {meta.itemName && <span>{String(meta.itemName)}</span>}
                        {meta.quantity != null && <span> · Qty: {String(meta.quantity)}</span>}
                        {meta.recipient && <span> → {String(meta.recipient)}</span>}
                        {meta.transactionId && (
                          <div className="text-[11px] text-slate-500 mt-0.5">Tx: #{String(meta.transactionId).slice(0, 8)}</div>
                        )}
                        {meta.soaId && (
                          <div className="text-[11px] text-slate-500 mt-0.5">SOA: #{String(meta.soaId).slice(0, 8)}</div>
                        )}
                        {meta.returnReason != null && meta.returnReason !== '' && (
                          <div className="mt-1 text-slate-500">Reason: {String(meta.returnReason)}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-2 border-t border-slate-100 text-xs text-slate-500">
            Total: {total}
          </div>
        </div>
      )}
    </div>
  );
};
