import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth.js';
import { notificationService } from '../services/notification/notification.service.js';

const NotificationContext = createContext(undefined);

// Same base URL the REST API already uses (see api.client.js) — Socket.io
// and Axios talk to the same backend, just over different protocols.
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3777';

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        notificationService.list(20),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // Silently ignore — the bell just won't update this cycle, no need to
      // interrupt the rest of the app over a notifications hiccup.
    }
  }, []);

  // Connect/disconnect the live socket whenever auth state changes.
  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Clear session-owned notifications when signing out.
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const token = localStorage.getItem('token'); // same key api.client.js reads
    if (!token) return;

    refresh();

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('notification:new', payload => {
      setUnreadCount(count => count + 1);
      setNotifications(prev => [
        { id: payload.id ?? `pending-${Date.now()}`, isRead: false, ...payload },
        ...prev,
      ].slice(0, 20));
    });

    return () => socket.disconnect();
  }, [isAuthenticated, refresh]);

  const markAsRead = async notificationId => {
    // Optimistic update: real ids are numbers; a "pending-..." id came from a
    // live push whose real DB row we haven't fetched yet (only happens for
    // new_question broadcasts, which don't carry a per-recipient id).
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount(count => Math.max(count - 1, 0));

    if (typeof notificationId === 'number') {
      try {
        await notificationService.markRead(notificationId);
      } catch {
        refresh(); // reconcile with the server if the update failed
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllRead();
    } catch {
      refresh();
    }
  };

  const value = { notifications, unreadCount, markAsRead, markAllAsRead, refresh };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- Keep the context hook beside its provider.
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
