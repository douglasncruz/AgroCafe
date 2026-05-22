"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/services/api';
import { toast } from 'sonner';

export interface AppNotification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  action_link?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  socket: Socket | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children, farmId }: { children: React.ReactNode, farmId?: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;
      
      const query = farmId ? `?farmId=${farmId}&limit=50` : `?limit=50`;
      const data = await api.get(`/notifications/recent${query}`, token);
      setNotifications(data || []);
    } catch (err) {
      console.error("Erro ao carregar notificações", err);
    }
  }, [farmId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const token = localStorage.getItem("@AgroCafe:token");
    if (!token) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // Connect to WebSocket Gateway
    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Notification WS connected');
      if (farmId) {
        newSocket.emit('joinFarm', farmId);
      }
    });

    newSocket.on('newNotification', (notif: AppNotification) => {
      setNotifications(prev => [notif, ...prev]);
      
      // Toast notification visually
      if (notif.priority === 'CRITICAL') {
        toast.error(notif.title, { description: notif.message, duration: 8000 });
      } else if (notif.priority === 'WARNING') {
        toast.warning(notif.title, { description: notif.message });
      } else {
        toast.info(notif.title, { description: notif.message });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [farmId]);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.put(`/notifications/${id}/read`, {}, token || "");
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!farmId) return;
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.put(`/notifications/read-all?farmId=${farmId}`, {}, token || "");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      await api.delete(`/notifications/${id}`, token || "");
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      socket,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refreshNotifications: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
