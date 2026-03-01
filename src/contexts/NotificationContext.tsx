import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'emergency' | 'urgent' | 'routine' | 'success' | 'info';
  title: string;
  message: string;
  patientName: string;
  startTime?: string;
  endTime?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Load notifications from localStorage
function loadNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem('app_notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n: Notification) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
    }
  } catch {
    // Ignore errors
  }
  return [];
}

// Save notifications to localStorage
function saveNotifications(notifications: Notification[]): void {
  try {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  } catch {
    // Ignore errors
  }
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(() => loadNotifications());

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50); // Keep last 50 notifications
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
