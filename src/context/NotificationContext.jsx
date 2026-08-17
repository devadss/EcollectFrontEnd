import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  // Load notifications
  const refreshNotifications = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      const data = await notificationService.getAll();
      setNotifications(data);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();

    // Periodic telemetry sync every 45s
    const interval = setInterval(() => {
      refreshNotifications();
    }, 45000);

    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // Mark single as read
  const markAsRead = async (id) => {
    setNotifications(prev => 
      prev.map(item => String(item.id) === String(id) ? { ...item, read: true } : item)
    );
    try {
      const updated = await notificationService.markAsRead(id);
      setNotifications(updated);
    } catch (err) {
      console.warn('Error marking notification read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(item => ({ ...item, read: true })));
    try {
      const updated = await notificationService.markAllRead();
      setNotifications(updated);
    } catch (err) {
      console.warn('Error marking all notifications read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    setNotifications(prev => prev.filter(item => String(item.id) !== String(id)));
    try {
      const updated = await notificationService.deleteNotification(id);
      setNotifications(updated);
    } catch (err) {
      console.warn('Error deleting notification:', err);
    }
  };

  // Clear all read notifications
  const clearAllRead = async () => {
    setNotifications(prev => prev.filter(item => !item.read));
    try {
      const updated = await notificationService.clearAllRead();
      setNotifications(updated);
    } catch (err) {
      console.warn('Error clearing read notifications:', err);
    }
  };

  // Add new notification programmatically
  const addNotification = (notif) => {
    const updated = notificationService.addNotification(notif);
    setNotifications(updated);
  };

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
