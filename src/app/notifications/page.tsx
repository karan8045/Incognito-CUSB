'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import {
  Bell,
  MessageSquare,
  CornerDownRight,
  ArrowBigUp,
  AtSign,
  Building2,
  CheckCheck,
  UserCheck,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  } | null;
}

export default function NotificationsPage() {
  const { setUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'POST_REPLY':
      case 'COMMENT_REPLY':
        return <CornerDownRight className="w-4 h-4 text-emerald-400" />;
      case 'UPVOTE':
        return <ArrowBigUp className="w-4 h-4 text-teal-400" />;
      case 'MENTION':
        return <AtSign className="w-4 h-4 text-sky-400" />;
      case 'CHAT_REQUEST':
      case 'CHAT_ACCEPTED':
        return <UserCheck className="w-4 h-4 text-indigo-400" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'DEPT_POST':
        return <Building2 className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex-1 flex gap-6">
      <Sidebar />

      <main className="flex-1 max-w-2xl min-w-0 pb-16 md:pb-6">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-emerald-400" />
              <span>Campus Notifications</span>
            </h1>
            <p className="text-xs text-slate-400">Activity on your discussions and private requests</p>
          </div>

          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-4 border border-slate-800 animate-pulse h-16" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center border border-slate-800 text-xs text-slate-400">
            <Bell className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="font-semibold text-white">No notifications yet</p>
            <p className="mt-1">When students interact with your posts or message you, alerts will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link || '#'}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all ${
                  n.isRead
                    ? 'glass-card border-slate-850 opacity-80 hover:opacity-100'
                    : 'glass-panel border-emerald-500/30 bg-emerald-950/20'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-white truncate">{n.title}</p>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
