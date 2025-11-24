import { useState, useRef, useEffect } from 'react';
import { LogOut, Menu, Bell, ChevronDown, CheckCircle, AlertTriangle, Info, X, Trash2, User } from 'lucide-react'; 
import { useNotifications } from '../../context/NotificationContext';

export default function Header({ user, onLogout, onToggleMenu }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Consumir datos reales del contexto
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotifications();
  
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-gray-900 border-b border-gray-800 shadow-md sticky top-0 z-30 h-16">
      <div className="flex justify-between items-center h-full px-6">
        
        {/* BOTÓN MENÚ: Siempre visible para controlar el sidebar */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleMenu}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          
          {/* NOTIFICACIONES REALES */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => { setIsNotifOpen(!isNotifOpen); markAllAsRead(); }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse"></span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-800">Notificaciones</h3>
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1">
                      <Trash2 size={12}/> Limpiar
                    </button>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                      <Bell size={24} className="text-gray-300" />
                      <p>No tienes notificaciones</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.read ? 'bg-blue-50/50' : ''}`}>
                        <div className={`mt-1 p-1.5 rounded-full h-fit shrink-0 ${
                          notif.type === 'success' ? 'bg-green-100 text-green-600' :
                          notif.type === 'error' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {notif.type === 'success' ? <CheckCircle size={14} /> :
                           notif.type === 'error' ? <AlertTriangle size={14} /> :
                           <Info size={14} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-800 hidden md:block"></div>

          {/* PERFIL DE USUARIO (Icono por defecto) */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="hidden md:flex flex-col items-end mr-1">
                <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                  {user?.nombre} {user?.apellido}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  {user?.rol?.nombre || 'Usuario'}
                </span>
              </div>

              {/* Icono genérico solicitado */}
              <div className="p-2 h-10 w-10 flex items-center justify-center bg-gray-800 rounded-full border border-gray-700 group-hover:border-gray-600 transition-colors text-gray-300 group-hover:text-white">
                <User size={20} />
              </div>

              <ChevronDown size={16} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                  <p className="text-sm font-semibold text-gray-900">{user?.nombre}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium rounded-lg"
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}