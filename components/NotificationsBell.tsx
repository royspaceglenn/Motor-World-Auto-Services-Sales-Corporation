import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { notificationsApi, USE_FIRESTORE_ADMIN_DATA, type NotificationItem } from '../lib/api/adminData';
import { getFirebaseFirestore, getFirebaseShopId } from '../lib/firebase/app';
import { FIRESTORE_COLLECTIONS } from '../lib/firebase/schema';
import { Bell, X } from 'lucide-react';
import { DashboardSurface } from './ui/DashboardPrimitives';

const PANEL_WIDTH = 384; // w-96

export const NotificationsBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const repositionPanel = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    let left = r.right - PANEL_WIDTH;
    if (left < margin) left = margin;
    const maxLeft = window.innerWidth - PANEL_WIDTH - margin;
    if (left > maxLeft) left = Math.max(margin, maxLeft);
    setPanelStyle({ top: r.bottom + margin, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    repositionPanel();
    const onScrollOrResize = () => repositionPanel();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, repositionPanel]);

  const load = useCallback(() => {
    setLoading(true);
    notificationsApi
      .list({ limit: 30, unreadOnly: true })
      .then((res) => {
        setNotifications(res.notifications);
        setUnreadCount(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (USE_FIRESTORE_ADMIN_DATA) {
      const db = getFirebaseFirestore();
      if (!db) return undefined;
      const shopId = getFirebaseShopId();
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.shops, shopId, FIRESTORE_COLLECTIONS.notifications),
        orderBy('createdAt', 'desc'),
        limit(80)
      );
      setLoading(true);
      return onSnapshot(
        q,
        (snap) => {
          const rows = snap.docs.map(
            (d) => ({ id: d.id, ...(d.data() as object) } as NotificationItem)
          );
          const unread = rows.filter((n) => !n.read);
          setNotifications(unread.slice(0, 30));
          setUnreadCount(unread.length);
          setLoading(false);
        },
        () => setLoading(false)
      );
    }

    load();
    const intervalMs = 10000;
    const t = setInterval(load, intervalMs);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (open && !USE_FIRESTORE_ADMIN_DATA) load();
  }, [open, load]);

  const markRead = useCallback(
    (id: string) => {
      setDismissingIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
      notificationsApi
        .markRead(id)
        .catch(() => load())
        .finally(() =>
          setDismissingIds((prev) => {
            const s = new Set(prev);
            s.delete(id);
            return s;
          }),
        );
    },
    [load],
  );

  const markAllRead = useCallback(() => {
    notificationsApi.markAllRead().then(() => load());
  }, [load]);

  const overlayAndPanel =
    open &&
    createPortal(
      <>
        <div
          className="fixed inset-0 z-[1000] bg-slate-900/20"
          aria-hidden
          onClick={() => setOpen(false)}
        />
        <DashboardSurface
          className="fixed z-[1010] w-96 max-w-[min(24rem,calc(100vw-1rem))] max-h-[80vh] overflow-hidden shadow-2xl ring-1 ring-slate-200/80"
          style={{ top: panelStyle.top, left: panelStyle.left }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="font-semibold text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-indigo-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-slate-500">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No notifications.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`group relative flex gap-2 p-3 pr-10 hover:bg-slate-50 ${!n.read ? 'bg-indigo-50/50' : ''}`}
                  >
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        if (!n.read) markRead(n.id);
                      }}
                    >
                      {n.sourceDisplayName && (
                        <p className="mb-0.5 text-xs font-medium text-indigo-700">{n.sourceDisplayName}</p>
                      )}
                      <p className="text-sm text-slate-800">{n.message}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      disabled={dismissingIds.has(n.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(n.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-50"
                      aria-label="Dismiss notification"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DashboardSurface>
      </>,
      document.body,
    );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-2xl border border-slate-200 bg-white/90 p-2.5 text-slate-500 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.32)] transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-700"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {overlayAndPanel}
    </div>
  );
};
