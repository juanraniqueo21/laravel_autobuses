import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Bus, MapPin, CheckCircle, AlertCircle, 
  User, Activity, TrendingUp, Briefcase, ChevronRight
} from 'lucide-react';
import { fetchAsistenteDashboard } from '../../services/api';

// Añadimos la prop onNavigate
export default function AsistenteDashboardPage({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await fetchAsistenteDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando panel de asistente...</div>;

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center justify-between">
          <div>
            <h3 className="font-bold mb-1 flex items-center gap-2"><AlertCircle size={20}/> Error al cargar dashboard</h3>
            <p className="text-sm opacity-80">{error}</p>
          </div>
          <button 
            onClick={loadDashboard}
            className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { asistente, metricas, proximo_turno } = dashboardData || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* 1. Header INTERACTIVO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div 
          onClick={() => onNavigate && onNavigate('perfil')} // Navega a 'perfil'
          className="group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
              Hola, {asistente?.nombre?.split(' ')[0]}
            </h1>
            <ChevronRight size={24} className="text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Activity size={16} className="text-green-500"/> 
            Panel de Asistente • {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-xs text-emerald-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Ver mi ficha personal
          </p>
        </div>
        
        {/* Badge de Estado */}
        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm border ${
          asistente?.estado === 'activo' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${asistente?.estado === 'activo' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
          Estado: {asistente?.estado?.toUpperCase()}
        </div>
      </div>

      {/* 2. Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Turnos Hoy */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Turnos Hoy</p>
              <h3 className="text-3xl font-bold text-gray-900">{metricas?.turnos_hoy || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md w-fit">
            Programados para hoy
          </p>
        </div>

        {/* Turnos Semana */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Esta Semana</p>
              <h3 className="text-3xl font-bold text-gray-900">{metricas?.turnos_semana || 0}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <Calendar size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium">Lunes a Domingo</p>
        </div>

        {/* Viajes Completados */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Completados (Mes)</p>
              <h3 className="text-3xl font-bold text-gray-900">{metricas?.viajes_completados_mes || 0}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
             <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Viajes en Curso */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">En Curso</p>
              <h3 className="text-3xl font-bold text-gray-900">{metricas?.viajes_en_curso || 0}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <MapPin size={24} />
            </div>
          </div>
           {metricas?.viajes_en_curso > 0 ? (
             <p className="text-xs text-amber-600 font-bold animate-pulse">● Activo ahora</p>
           ) : (
             <p className="text-xs text-gray-400">Sin actividad actual</p>
           )}
        </div>
      </div>

      {/* 3. Sección Principal: Grid Asimétrico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: Tarjeta Oscura de Perfil + Estadísticas Rápidas */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Tarjeta Perfil (Dark Gradient) */}
            <div 
                onClick={() => onNavigate && onNavigate('perfil')}
                className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden cursor-pointer group hover:shadow-xl transition-all"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <User size={100} />
                </div>
                <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform">
                        <Briefcase size={32} />
                    </div>
                    <h2 className="text-xl font-bold">{asistente?.nombre} {asistente?.apellido}</h2>
                    <p className="text-slate-400 text-sm mt-1">Nº Ficha: {asistente?.numero_funcional}</p>
                    
                    <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-end">
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Rol</p>
                            <p className="text-lg font-bold text-blue-400">Asistente</p>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-xs font-bold bg-green-500/20 text-green-400`}>
                            {asistente?.estado?.toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumen Mensual */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-gray-400" size={20} />
                    <h3 className="font-bold text-gray-700">Resumen Mensual</h3>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Turnos Totales</span>
                        <span className="font-bold text-slate-800">{metricas?.turnos_mes || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Viajes Totales</span>
                        <span className="font-bold text-slate-800">{metricas?.viajes_completados_mes || 0}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: Próximo Turno (Estilo Detallado) */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <Clock size={18} className="text-green-600"/> Próximo Turno Asignado
                    </h3>
                    {proximo_turno && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            proximo_turno.tipo_turno === 'mañana' ? 'bg-amber-100 text-amber-700' :
                            proximo_turno.tipo_turno === 'tarde' ? 'bg-orange-100 text-orange-700' :
                            'bg-indigo-100 text-indigo-700'
                        }`}>
                            {proximo_turno.tipo_turno}
                        </span>
                    )}
                </div>

                <div className="p-8 flex-1 flex flex-col justify-center">
                    {proximo_turno ? (
                        <div className="space-y-8">
                            {/* Fecha y Hora */}
                            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Fecha</p>
                                    <p className="text-3xl font-bold text-gray-900 capitalize">
                                        {formatDate(proximo_turno.fecha)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Inicio</p>
                                        <p className="text-xl font-bold text-green-600 font-mono">{formatTime(proximo_turno.hora_inicio)}</p>
                                    </div>
                                    <div className="h-8 w-px bg-gray-300"></div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Término</p>
                                        <p className="text-xl font-bold text-red-500 font-mono">{formatTime(proximo_turno.hora_termino)}</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-dashed border-gray-200"/>

                            {/* Bus Asignado */}
                            {proximo_turno.bus ? (
                                <div>
                                    <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-3">Unidad Asignada</p>
                                    <div className="flex items-center gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors">
                                        <div className="bg-white p-3 rounded-lg shadow-sm text-blue-600">
                                            <Bus size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-gray-900">{proximo_turno.bus.patente}</h4>
                                            <p className="text-gray-600 text-sm">{proximo_turno.bus.marca} {proximo_turno.bus.modelo}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-xl text-gray-500 text-sm flex items-center gap-2">
                                    <AlertCircle size={16}/> Sin bus asignado aún
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                                <Calendar className="text-gray-300" size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">Sin turnos próximos</h4>
                            <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                No tienes turnos programados en el calendario próximo. Contacta a operaciones si crees que es un error.
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Footer Resumen */}
                <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 rounded-b-2xl">
                    <span>Tasa de cumplimiento mensual:</span>
                    <span className="font-bold text-gray-700 bg-white px-2 py-1 rounded shadow-sm">
                        {metricas?.turnos_mes > 0 
                            ? Math.round((metricas?.viajes_completados_mes / metricas?.turnos_mes) * 100) 
                            : 0}%
                    </span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}