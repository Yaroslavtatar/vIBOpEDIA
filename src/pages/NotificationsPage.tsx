import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Notification } from '../types/index.js';
import { formatDateTime } from '../utils/formatters.js';
import { Bell, Check } from 'lucide-react';

interface NotificationsPageProps {
  onNavigate: (path: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifs = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-3xl mx-auto">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
          <Bell className="w-7 h-7 text-indigo-500" />
          <span>Центр уведомлений</span>
        </h1>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Загрузка уведомлений...</div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          Уведомлений нет.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                handleMarkRead(n.id);
                if (n.linkUrl) onNavigate(n.linkUrl);
              }}
              className={`p-4 rounded-2xl cursor-pointer transition flex items-start justify-between gap-4 ${
                !n.isRead ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mb-1">{n.title}</div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">{n.message}</p>
                <span className="text-[10px] text-slate-400">{formatDateTime(n.createdAt)}</span>
              </div>

              {!n.isRead && (
                <span className="p-1 bg-indigo-600 text-white rounded-full shrink-0">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
