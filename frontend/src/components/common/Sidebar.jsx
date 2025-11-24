import React from 'react';
import { 
  LayoutDashboard, Users, UserCog, Wrench, Bus, Map, 
  CalendarClock, ClipboardList, BarChart2, Shield, User,
  Briefcase, Navigation, HardHat, X
} from 'lucide-react';

export default function Sidebar({ current, onSelect, isOpen, onClose }) {
  
  // Helper para el estilo de los botones (Tu diseño exacto)
  const getButtonClasses = (id) => {
    const isActive = current === id;
    return `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-left ${
      isActive
        ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/20'
        : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-5'
    }`;
  };

  const getIconClasses = (id) => {
    const isActive = current === id;
    return `transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`;
  };

  const handleSelect = (id) => {
    onSelect(id);
    // Cerrar menú en móvil al seleccionar
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* 1. BACKDROP: Fondo oscuro borroso */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. PANEL LATERAL (Estilo Cristal + Animación) */}
      <aside 
        className={`fixed top-0 left-0 h-screen w-72 z-50 
          bg-gray-800/95 backdrop-blur-md text-white 
          border-r border-white/10 shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          
          {/* Cabecera */}
          <div className="p-6 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bus className="text-blue-500" size={28} />
              <h2 className="text-xl font-bold text-white tracking-wide">ConectaFlota</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Lista de Navegación */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            
            {/* SECCIÓN: PRINCIPAL */}
            <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-1">
              Principal
            </p>
            <button onClick={() => handleSelect('dashboard')} className={getButtonClasses('dashboard')}>
              <LayoutDashboard size={20} className={getIconClasses('dashboard')} />
              <span className="font-medium truncate">Dashboard</span>
            </button>

            {/* SECCIÓN: OPERACIONES */}
            <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
              Operaciones
            </p>
            
            {/* BOTÓN NUEVO: TURNOS */}
            <button onClick={() => handleSelect('turnos')} className={getButtonClasses('turnos')}>
              <CalendarClock size={20} className={getIconClasses('turnos')} />
              <span className="font-medium truncate">Planificación</span>
            </button>

            <button onClick={() => handleSelect('viajes')} className={getButtonClasses('viajes')}>
              <Navigation size={20} className={getIconClasses('viajes')} />
              <span className="font-medium truncate">Gestión de Viajes</span>
            </button>

            <button onClick={() => handleSelect('mantenimientos')} className={getButtonClasses('mantenimientos')}>
              <Wrench size={20} className={getIconClasses('mantenimientos')} />
              <span className="font-medium truncate">Mantenimiento</span>
            </button>

            {/* SECCIÓN: RECURSOS */}
            <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
              Recursos
            </p>

            <button onClick={() => handleSelect('empleados')} className={getButtonClasses('empleados')}>
              <Briefcase size={20} className={getIconClasses('empleados')} />
              <span className="font-medium truncate">Empleados (Todos)</span>
            </button>

            {/* Sub-categorías visuales (indentadas) */}
            <div className="pl-2 space-y-1 mt-1">
               <button onClick={() => handleSelect('conductores')} className={getButtonClasses('conductores')}>
                <User size={18} className={getIconClasses('conductores')} />
                <span className="font-medium truncate">Conductores</span>
              </button>
              <button onClick={() => handleSelect('asistentes')} className={getButtonClasses('asistentes')}>
                <User size={18} className={getIconClasses('asistentes')} />
                <span className="font-medium truncate">Asistentes</span>
              </button>
              <button onClick={() => handleSelect('mecanicos')} className={getButtonClasses('mecanicos')}>
                <UserCog size={18} className={getIconClasses('mecanicos')} />
                <span className="font-medium truncate">Mecánicos</span>
              </button>
            </div>

            <div className="mt-2 space-y-1">
              <button onClick={() => handleSelect('buses')} className={getButtonClasses('buses')}>
                <Bus size={20} className={getIconClasses('buses')} />
                <span className="font-medium truncate">Flota de Buses</span>
              </button>
              <button onClick={() => handleSelect('rutas')} className={getButtonClasses('rutas')}>
                <Map size={20} className={getIconClasses('rutas')} />
                <span className="font-medium truncate">Rutas y Destinos</span>
              </button>
            </div>

            {/* SECCIÓN: ADMINISTRACIÓN */}
            <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
              Administración
            </p>

            <button onClick={() => handleSelect('logistica')} className={getButtonClasses('logistica')}>
              <BarChart2 size={20} className={getIconClasses('logistica')} />
              <span className="font-medium truncate">Logística</span>
            </button>

            <button onClick={() => handleSelect('usuarios')} className={getButtonClasses('usuarios')}>
              <Users size={20} className={getIconClasses('usuarios')} />
              <span className="font-medium truncate">Usuarios Sistema</span>
            </button>

            <button onClick={() => handleSelect('roles')} className={getButtonClasses('roles')}>
              <Shield size={20} className={getIconClasses('roles')} />
              <span className="font-medium truncate">Roles y Permisos</span>
            </button>

          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 text-xs text-center text-gray-500">
            &copy; 2025 Sistema de Gestión
          </div>
        </div>
      </aside>
    </>
  );
}