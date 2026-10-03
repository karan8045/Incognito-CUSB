'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  semester?: string | null;
  bio?: string | null;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  unreadCount: number;
  pendingRequestsCount: number;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setPendingRequestsCount: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  unreadCount: 0,
  pendingRequestsCount: 0,
  refreshUser: async () => {},
  logout: async () => {},
  setUnreadCount: () => {},
  setPendingRequestsCount: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.counts) {
          setUnreadCount(data.counts.unreadNotifications || 0);
          setPendingRequestsCount(data.counts.pendingChatRequests || 0);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Real-time EventSource listener for logged-in user
  useEffect(() => {
    if (!user) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/stream');

      eventSource.addEventListener('notification', () => {
        setUnreadCount((prev) => prev + 1);
        // Play subtle sound or dispatch event
        window.dispatchEvent(new CustomEvent('cusb:notification'));
      });

      eventSource.addEventListener('chat_request', () => {
        setPendingRequestsCount((prev) => prev + 1);
        window.dispatchEvent(new CustomEvent('cusb:chat_request'));
      });

      eventSource.addEventListener('message', (e) => {
        try {
          const data = JSON.parse(e.data);
          window.dispatchEvent(new CustomEvent('cusb:message', { detail: data }));
        } catch {}
      });

      eventSource.addEventListener('typing', (e) => {
        try {
          const data = JSON.parse(e.data);
          window.dispatchEvent(new CustomEvent('cusb:typing', { detail: data }));
        } catch {}
      });

      eventSource.addEventListener('read', (e) => {
        try {
          const data = JSON.parse(e.data);
          window.dispatchEvent(new CustomEvent('cusb:read', { detail: data }));
        } catch {}
      });

      eventSource.addEventListener('reaction', (e) => {
        try {
          const data = JSON.parse(e.data);
          window.dispatchEvent(new CustomEvent('cusb:reaction', { detail: data }));
        } catch {}
      });
    } catch (err) {
      console.warn('Realtime SSE connection failed, relying on page updates.', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        unreadCount,
        pendingRequestsCount,
        refreshUser,
        logout,
        setUnreadCount,
        setPendingRequestsCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
