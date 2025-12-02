import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Bus, MapPin, CheckCircle, AlertCircle, 
  User, Award, Activity, TrendingUp, AlertTriangle, ChevronRight, Wrench, PenTool
} from 'lucide-react';
import { fetchMecanicoDashboard } from '../../services/api';

// Recibimos onNavigate para poder redirigir al perfil
export default function MecanicoDashboardPage({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await fetchMecanicoDashboard();
      console.log("Datos Dashboard Mecánico:", data); // Para depuración
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError(err.message || "Error de conexión al cargar el panel.");
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

  // Renderizado de carga
  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando panel de taller...</div>;

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

  const { mecanico, metricas, proxima_mantencion } = dashboardData || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* 1. Header estilo ConectaFlota - INTERACTIVO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div 
          onClick={() => onNavigate && onNavigate('perfil')} // Navega a 'perfil'
          className="group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              Hola, {mecanico?.nombre?.split(' ')[0] || 'Mecánico'}
            </h1>
            <ChevronRight size={24} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Wrench size={16} className="text-blue-500"/> 
            Panel de Mecánico • {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-xs text-blue-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Ver mi ficha técnica
          </p>
        </div>
      </div>

      {/* 2. Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Tareas Pendientes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pendientes</p>
              <h3 className="text-3xl font-bold text-gray-900">{metricas?.pendientes || 0}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-md w-fit">
            Tareas por realizar
          </p>
        </div>

        {/* Completadas Mes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Realizadas (Mes)</p>
              <h3 className="text-3xl font-bold text-gray-900">{metricas?.completadas_mes || 0}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Total Histórico */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Histórico</p>
              <h3 className="text-3xl font-bold text-gray-900">{metricas?.total_historico || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium">Desde inicio de contrato</p>
        </div>

        {/* Estado / Disponibilidad */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Estado Actual</p>
              <h3 className="text-xl font-bold text-gray-900 capitalize">{mecanico?.estado || 'Activo'}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <User size={24} />
            </div>
          </div>
          <p className="text-xs text-green-600 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Disponible
          </p>
        </div>
      </div>

      {/* 3. Sección Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA IZQUIERDA: Tarjeta Oscura de Perfil + Examen Ocupacional */}
        <div className="lg:col-span-1 space-y-6">
            
          {/* Tarjeta Perfil */}
          <div 
            onClick={() => onNavigate && onNavigate('perfil')} // Navega a 'perfil'
            className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden cursor-pointer group hover:shadow-xl transition-all"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wrench size={100} />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform">
                <User size={32} />
              </div>
              <h2 className="text-xl font-bold">{mecanico?.nombre}</h2>
              <p className="text-slate-400 text-sm mt-1">Ficha: {mecanico?.empleado?.numero_funcional || 'S/N'}</p>
              
              <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">N° Certificación</p>
                  <p className="text-xl font-bold text-blue-400">{mecanico?.numero_certificacion || '---'}</p>
                </div>
                {/* Especialidades */}
                <div className="text-right">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Especialidad</p>
                  <div className="flex flex-wrap justify-end gap-1">
                     {Array.isArray(mecanico?.especialidad) ? (
                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-700 text-slate-200">
                           {mecanico.especialidad[0]} {mecanico.especialidad.length > 1 ? `+${mecanico.especialidad.length - 1}` : ''}
                        </span>
                     ) : (
                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-700 text-slate-200">
                           {mecanico?.especialidad || 'General'}
                        </span>
                     )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estado Salud / Examen Ocupacional */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-gray-400" size={20} />
              <h3 className="font-bold text-gray-700">Examen Ocupacional</h3>
            </div>
            
            {mecanico?.fecha_examen_ocupacional ? (() => {
              return (
                <div className="p-4 rounded-xl border bg-gray-50 border-gray-200 flex flex-col gap-2 text-center">
                  <Activity size={32} className="mx-auto mb-1 text-blue-500"/>
                  <p className="font-bold text-lg text-gray-800">Fecha Examen</p>
                  <p className="text-xl font-mono text-gray-600">
                    {new Date(mecanico.fecha_examen_ocupacional).toLocaleDateString('es-CL')}
                  </p>
                </div>
              );
            })() : (
              <div className="p-4 rounded-xl border bg-gray-50 border-gray-200 text-center text-gray-500 text-sm">
                 No hay registro de examen.
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: Próxima Mantención */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Clock size={18} className="text-blue-500"/> Próxima Tarea Asignada
              </h3>
              <button 
                onClick={() => onNavigate('mecanico-mantenimientos')}
                className="text-blue-600 text-sm hover:text-blue-800 font-medium transition-colors"
              >
                Ver todas →
              </button>
            </div>

            <div className="p-8 flex-1 flex flex-col justify-center">
              {proxima_mantencion ? (
                <div className="space-y-8">
                  {/* Fecha y Tipo */}
                  <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Fecha Programada</p>
                      <p className="text-3xl font-bold text-gray-900 capitalize">
                        {formatDate(proxima_mantencion.fecha_programada)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Tipo</p>
                        <p className="text-xl font-bold text-blue-600 font-mono capitalize">
                          {proxima_mantencion.tipo_mantenimiento}
                        </p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-dashed border-gray-200"/>

                  {/* Bus */}
                  {proxima_mantencion.bus ? (
                    <div>
                      <p className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-3">Unidad a Intervenir</p>
                      <div className="flex items-center gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors">
                        <div className="bg-white p-3 rounded-lg shadow-sm text-blue-600">
                          <Bus size={32} />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{proxima_mantencion.bus.patente}</h4>
                          <p className="text-gray-600 text-sm">{proxima_mantencion.bus.marca} {proxima_mantencion.bus.modelo}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl text-gray-500 text-sm flex items-center gap-2">
                      <AlertCircle size={16}/> Sin información del bus
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                    <CheckCircle className="text-green-500" size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">¡Todo al día!</h4>
                  <p className="text-gray-500 max-w-xs mx-auto mt-2">
                    No tienes mantenimientos pendientes asignados por el momento.
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 rounded-b-2xl">
              <span>Rendimiento mensual:</span>
              <span className="font-bold text-gray-700 bg-white px-2 py-1 rounded shadow-sm">
                {metricas?.completadas_mes || 0} trabajos
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}