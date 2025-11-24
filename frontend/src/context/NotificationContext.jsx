import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // Función para agregar una notificación real
  const addNotification = useCallback((type, title, message) => {
    const id = Date.now();
    const time = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    
    // Agregamos la nueva al principio de la lista
    setNotifications((prev) => [
      { id, type, title, message, time, read: false },
      ...prev
    ]);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // MODIFICADO: Agregar advertencia antes de eliminar
  const clearNotifications = () => {
    if (notifications.length === 0) return; // No hacer nada si ya está vacío

    // Advertencia nativa del navegador
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar todas las notificaciones?");
    
    if (confirmDelete) {
      setNotifications([]);
    }
  };

  // Contar no leídas
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllAsRead, clearNotifications, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}