import React from 'react';
import {
  LayoutDashboard, Users, UserCog, Wrench, Bus, Map,
  CalendarClock, Navigation, TrendingUp, Shield, User, Briefcase,
  X, DollarSign, Calendar, MapPin, FileText, ClipboardList, BarChart3
} from 'lucide-react';

const Sidebar = ({ current, onSelect, isOpen, onClose, user }) => {
  // CORRECCIÓN: aseguramos que rolId sea numérico
  const rolId = user ? Number(user.rol_id || user.rol?.id || 0) : 0;

  const getButtonClasses = (id) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-left ${
      current === id
        ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/20'
        : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-5'
    }`;

  const getIconClasses = (id) =>
    `transition-colors ${
      current === id ? 'text-white' : 'text-gray-400 group-hover:text-white'
    }`;

  const handleSelect = (id) => {
    onSelect(id);
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  // ================= ADMIN / GERENTE (Roles 1 y 2) =================
  const renderAdminGerente = () => (
    <>
      {/* Principal */}
      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-1">
        Principal
      </p>

      <button
        onClick={() => handleSelect('dashboard')}
        className={getButtonClasses('dashboard')}
      >
        <LayoutDashboard size={20} className={getIconClasses('dashboard')} />
        <span className="font-medium truncate">Dashboard</span>
      </button>

      {/* Operaciones */}
      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Operaciones
      </p>

      <button
        onClick={() => handleSelect('turnos')}
        className={getButtonClasses('turnos')}
      >
        <CalendarClock size={20} className={getIconClasses('turnos')} />
        <span className="font-medium truncate">Planificación</span>
      </button>

      {/* REPORTES - AGREGADO */}
      <button
        onClick={() => handleSelect('reportes')}
        className={getButtonClasses('reportes')}
      >
        <ClipboardList size={20} className={getIconClasses('reportes')} />
        <span className="font-medium truncate">Reportes</span>
      </button>

      <button
        onClick={() => handleSelect('viajes')}
        className={getButtonClasses('viajes')}
      >
        <Navigation size={20} className={getIconClasses('viajes')} />
        <span className="font-medium truncate">Gestión de Viajes</span>
      </button>

      <button
        onClick={() => handleSelect('mantenimientos')}
        className={getButtonClasses('mantenimientos')}
      >
        <Wrench size={20} className={getIconClasses('mantenimientos')} />
        <span className="font-medium truncate">Mantenimiento</span>
      </button>

      {/* Liquidaciones */}
      <button
        onClick={() => handleSelect('liquidaciones')}
        className={getButtonClasses('liquidaciones')}
      >
        <DollarSign size={20} className={getIconClasses('liquidaciones')} />
        <span className="font-medium truncate">Liquidaciones</span>
      </button>

      {/* Recursos */}
      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Recursos
      </p>

      <button
        onClick={() => handleSelect('empleados')}
        className={getButtonClasses('empleados')}
      >
        <Briefcase size={20} className={getIconClasses('empleados')} />
        <span className="font-medium truncate">Empleados (Todos)</span>
      </button>

      <button
        onClick={() => handleSelect('licencias')}
        className={getButtonClasses('licencias')}
      >
        <FileText size={20} className={getIconClasses('licencias')} />
        <span className="font-medium truncate">Licencias</span>
      </button>

      {/* Sub-categorías visuales */}
      <div className="pl-2 space-y-1 mt-1">
        <button
          onClick={() => handleSelect('conductores')}
          className={getButtonClasses('conductores')}
        >
          <User size={18} className={getIconClasses('conductores')} />
          <span className="font-medium truncate">Conductores</span>
        </button>
        <button
          onClick={() => handleSelect('asistentes')}
          className={getButtonClasses('asistentes')}
        >
          <User size={18} className={getIconClasses('asistentes')} />
          <span className="font-medium truncate">Asistentes</span>
        </button>
        <button
          onClick={() => handleSelect('mecanicos')}
          className={getButtonClasses('mecanicos')}
        >
          <UserCog size={18} className={getIconClasses('mecanicos')} />
          <span className="font-medium truncate">Mecánicos</span>
        </button>
      </div>

      <div className="mt-2 space-y-1">
        <button
          onClick={() => handleSelect('buses')}
          className={getButtonClasses('buses')}
        >
          <Bus size={20} className={getIconClasses('buses')} />
          <span className="font-medium truncate">Flota de Buses</span>
        </button>

        {/* NUEVO: Botón de Análisis Buses */}
        <button
          onClick={() => handleSelect('analisis-buses')}
          className={getButtonClasses('analisis-buses')}
        >
          <BarChart3 size={20} className={getIconClasses('analisis-buses')} />
          <span className="font-medium truncate">Análisis Buses</span>
        </button>

        {/* NUEVO: Botón de Análisis Mantenimientos */}
        <button
          onClick={() => handleSelect('analisis-mantenimientos')}
          className={getButtonClasses('analisis-mantenimientos')}
        >
          <Wrench size={20} className={getIconClasses('analisis-mantenimientos')} />
          <span className="font-medium truncate">Análisis Mantenimientos</span>
        </button>

        {/* NUEVO: Botón de Análisis RRHH */}
        <button
          onClick={() => handleSelect('analisis-rrhh')}
          className={getButtonClasses('analisis-rrhh')}
        >
          <Users size={20} className={getIconClasses('analisis-rrhh')} />
          <span className="font-medium truncate">Análisis RRHH</span>
        </button>

        <button
          onClick={() => handleSelect('rutas')}
          className={getButtonClasses('rutas')}
        >
          <Map size={20} className={getIconClasses('rutas')} />
          <span className="font-medium truncate">Rutas y Destinos</span>
        </button>
      </div>

      {/* Administración */}
      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Administración
      </p>

      <button
        onClick={() => handleSelect('logistica')}
        className={getButtonClasses('logistica')}
      >
        <TrendingUp size={20} className={getIconClasses('logistica')} />
        <span className="font-medium truncate">Logística</span>
      </button>

      <button
        onClick={() => handleSelect('usuarios')}
        className={getButtonClasses('usuarios')}
      >
        <Users size={20} className={getIconClasses('usuarios')} />
        <span className="font-medium truncate">Usuarios Sistema</span>
      </button>

      <button
        onClick={() => handleSelect('roles')}
        className={getButtonClasses('roles')}
      >
        <Shield size={20} className={getIconClasses('roles')} />
        <span className="font-medium truncate">Roles y Permisos</span>
      </button>
    </>
  );

  // ================= RRHH (Rol 6) =================
  const renderRRHH = () => (
    <>
      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-1">
        Panel RRHH
      </p>

      <button
        onClick={() => handleSelect('dashboard')}
        className={getButtonClasses('dashboard')}
      >
        <LayoutDashboard size={20} className={getIconClasses('dashboard')} />
        <span className="font-medium truncate">Dashboard</span>
      </button>

      {/* Operaciones */}
      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Operaciones
      </p>

      {/* REPORTES - AGREGADO */}
      <button
        onClick={() => handleSelect('reportes')}
        className={getButtonClasses('reportes')}
      >
        <ClipboardList size={20} className={getIconClasses('reportes')} />
        <span className="font-medium truncate">Reportes</span>
      </button>

      <button
        onClick={() => handleSelect('liquidaciones')}
        className={getButtonClasses('liquidaciones')}
      >
        <DollarSign size={20} className={getIconClasses('liquidaciones')} />
        <span className="font-medium truncate">Liquidaciones</span>
      </button>

      <button
        onClick={() => handleSelect('analisis-rrhh')}
        className={getButtonClasses('analisis-rrhh')}
      >
        <Users size={20} className={getIconClasses('analisis-rrhh')} />
        <span className="font-medium truncate">Análisis RRHH</span>
      </button>

      {/* Recursos Humanos */}
      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Recursos Humanos
      </p>

      <button
        onClick={() => handleSelect('empleados')}
        className={getButtonClasses('empleados')}
      >
        <Briefcase size={20} className={getIconClasses('empleados')} />
        <span className="font-medium truncate">Empleados</span>
      </button>

      <button
        onClick={() => handleSelect('conductores')}
        className={getButtonClasses('conductores')}
      >
        <User size={20} className={getIconClasses('conductores')} />
        <span className="font-medium truncate">Conductores</span>
      </button>

      <button
        onClick={() => handleSelect('asistentes')}
        className={getButtonClasses('asistentes')}
      >
        <User size={20} className={getIconClasses('asistentes')} />
        <span className="font-medium truncate">Asistentes</span>
      </button>

      <button
        onClick={() => handleSelect('mecanicos')}
        className={getButtonClasses('mecanicos')}
      >
        <UserCog size={20} className={getIconClasses('mecanicos')} />
        <span className="font-medium truncate">Mecánicos</span>
      </button>

      <button
        onClick={() => handleSelect('licencias')}
        className={getButtonClasses('licencias')}
      >
        <FileText size={20} className={getIconClasses('licencias')} />
        <span className="font-medium truncate">Licencias</span>
      </button>
    </>
  );

  // ================= CONDUCTOR (Rol 3) =================
  const renderConductor = () => (
    <>
      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-1">
        Panel Conductor
      </p>

      <button
        onClick={() => handleSelect('conductor-dashboard')}
        className={getButtonClasses('conductor-dashboard')}
      >
        <LayoutDashboard
          size={20}
          className={getIconClasses('conductor-dashboard')}
        />
        <span className="font-medium truncate">Mi Dashboard</span>
      </button>

      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Mis Actividades
      </p>

      <button
        onClick={() => handleSelect('conductor-turnos')}
        className={getButtonClasses('conductor-turnos')}
      >
        <CalendarClock
          size={20}
          className={getIconClasses('conductor-turnos')}
        />
        <span className="font-medium truncate">Mis Turnos</span>
      </button>

      <button
        onClick={() => handleSelect('conductor-viajes')}
        className={getButtonClasses('conductor-viajes')}
      >
        <Navigation
          size={20}
          className={getIconClasses('conductor-viajes')}
        />
        <span className="font-medium truncate">Mis Viajes</span>
      </button>

      {/* MIS REPORTES - AGREGADO */}
      <button
        onClick={() => handleSelect('mis-reportes')}
        className={getButtonClasses('mis-reportes')}
      >
        <ClipboardList size={20} className={getIconClasses('mis-reportes')} />
        <span className="font-medium truncate">Mis Reportes</span>
      </button>

      <button
        onClick={() => handleSelect('licencias')}
        className={getButtonClasses('licencias')}
      >
        <FileText size={20} className={getIconClasses('licencias')} />
        <span className="font-medium truncate">Mis Licencias</span>
      </button>

      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Cuenta
      </p>

      <button
        onClick={() => handleSelect('perfil')}
        className={getButtonClasses('perfil')}
      >
        <User size={20} className={getIconClasses('perfil')} />
        <span className="font-medium truncate">Mi Perfil</span>
      </button>
    </>
  );

  // ================= ASISTENTE (Rol 5) =================
  const renderAsistente = () => (
    <>
      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-1">
        Panel Asistente
      </p>

      <button
        onClick={() => handleSelect('asistente-dashboard')}
        className={getButtonClasses('asistente-dashboard')}
      >
        <LayoutDashboard
          size={20}
          className={getIconClasses('asistente-dashboard')}
        />
        <span className="font-medium truncate">Mi Dashboard</span>
      </button>

      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Mis Actividades
      </p>

      <button
        onClick={() => handleSelect('asistente-turnos')}
        className={getButtonClasses('asistente-turnos')}
      >
        <CalendarClock
          size={20}
          className={getIconClasses('asistente-turnos')}
        />
        <span className="font-medium truncate">Mis Turnos</span>
      </button>

      <button
        onClick={() => handleSelect('asistente-viajes')}
        className={getButtonClasses('asistente-viajes')}
      >
        <Navigation
          size={20}
          className={getIconClasses('asistente-viajes')}
        />
        <span className="font-medium truncate">Mis Viajes</span>
      </button>

      {/* MIS REPORTES - AGREGADO */}
      <button
        onClick={() => handleSelect('mis-reportes')}
        className={getButtonClasses('mis-reportes')}
      >
        <ClipboardList size={20} className={getIconClasses('mis-reportes')} />
        <span className="font-medium truncate">Mis Reportes</span>
      </button>

      <button
        onClick={() => handleSelect('licencias')}
        className={getButtonClasses('licencias')}
      >
        <FileText size={20} className={getIconClasses('licencias')} />
        <span className="font-medium truncate">Mis Licencias</span>
      </button>

      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Cuenta
      </p>

      <button
        onClick={() => handleSelect('perfil')}
        className={getButtonClasses('perfil')}
      >
        <User size={20} className={getIconClasses('perfil')} />
        <span className="font-medium truncate">Mi Perfil</span>
      </button>
    </>
  );

  // ================= MECÁNICO (Rol 4) =================
  const renderMecanico = () => (
    <>
      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-1">
        Panel Mecánico
      </p>

      <button
        onClick={() => handleSelect('mecanico-dashboard')}
        className={getButtonClasses('mecanico-dashboard')}
      >
        <LayoutDashboard
          size={20}
          className={getIconClasses('mecanico-dashboard')}
        />
        <span className="font-medium truncate">Mi Dashboard</span>
      </button>

      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Mis Actividades
      </p>

      <button
        onClick={() => handleSelect('mecanico-mantenimientos')}
        className={getButtonClasses('mecanico-mantenimientos')}
      >
        <Wrench
          size={20}
          className={getIconClasses('mecanico-mantenimientos')}
        />
        <span className="font-medium truncate">Mis Trabajos</span>
      </button>

      {/* MIS REPORTES - AGREGADO */}
      <button
        onClick={() => handleSelect('mis-reportes')}
        className={getButtonClasses('mis-reportes')}
      >
        <ClipboardList size={20} className={getIconClasses('mis-reportes')} />
        <span className="font-medium truncate">Mis Reportes</span>
      </button>

      {/* MIS LICENCIAS - DEL PANEL GENERAL */}
      <button
        onClick={() => handleSelect('licencias')}
        className={getButtonClasses('licencias')}
      >
        <FileText size={20} className={getIconClasses('licencias')} />
        <span className="font-medium truncate">Mis Licencias</span>
      </button>

      <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">
        Cuenta
      </p>

      <button
        onClick={() => handleSelect('perfil')}
        className={getButtonClasses('perfil')}
      >
        <User size={20} className={getIconClasses('perfil')} />
        <span className="font-medium truncate">Mi Perfil</span>
      </button>
    </>
  );

  // ================= RENDERIZAR MENÚ SEGÚN ROL =================
  const renderMenu = () => {
    if ([1, 2].includes(rolId)) return renderAdminGerente();
    if (rolId === 6) return renderRRHH();
    if (rolId === 3) return renderConductor();
    if (rolId === 5) return renderAsistente();
    if (rolId === 4) return renderMecanico();

    return (
      <p className="px-4 text-xs text-gray-500">
        Sin permisos de navegación. (Rol ID: {rolId})
      </p>
    );
  };

  return (
    <>
      {/* Overlay de fondo */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 z-50 
        bg-gray-800/95 backdrop-blur-md text-white 
        border-r border-white/10 shadow-2xl
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bus className="text-blue-500" size={28} />
              <h2 className="text-xl font-bold text-white tracking-wide">
                ConectaFlota
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors lg:hidden"
            >
              <X size={24} />
            </button>
          </div>

          {/* Menú de navegación */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {renderMenu()}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 text-xs text-center text-gray-500">
            &copy; 2025 Sistema de Gestión
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
