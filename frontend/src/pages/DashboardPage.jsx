import React, { useState, useEffect } from 'react';
import { 
  Bus, MapPin, Users, Wrench, TrendingUp, AlertCircle, CheckCircle, Clock, ArrowRight, Activity 
} from 'lucide-react';
import { fetchBuses, fetchRutas, fetchTurnos, fetchViajesPorTurno } from '../services/api';

export default function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState({
    busesTotal: 0,
    busesOperativos: 0,
    busesMantenimiento: 0,
    rutasActivas: 0,
    viajesHoy: 0,
    viajesCompletadosHoy: 0
  });
  const [turnosDelDia, setTurnosDelDia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [buses, rutas, turnosHoy] = await Promise.all([
        fetchBuses(),
        fetchRutas(),
        fetchTurnos({ fecha: today })
      ]);

      // Procesar Buses
      const operativos = buses.filter(b => b.estado === 'operativo' || b.estado === 'activo').length;
      const mantenimiento = buses.filter(b => b.estado === 'mantenimiento').length;

      // Procesar Turnos y Viajes de Hoy
      let totalViajes = 0;
      let completados = 0;

      const turnosEnriquecidos = await Promise.all(turnosHoy.map(async (turno) => {
        try {
          const viajes = await fetchViajesPorTurno(turno.id);
          totalViajes += viajes.length;
          const completadosTurno = viajes.filter(v => v.estado === 'completado').length;
          completados += completadosTurno;
          
          const progreso = viajes.length > 0 ? Math.round((completadosTurno / viajes.length) * 100) : 0;

          return { ...turno, viajesTotales: viajes.length, viajesCompletados: completadosTurno, progreso };
        } catch (e) {
          return { ...turno, viajesTotales: 0, viajesCompletados: 0, progreso: 0 };
        }
      }));

      // Ordenar por hora más reciente/cercana
      turnosEnriquecidos.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

      setStats({
        busesTotal: buses.length,
        busesOperativos: operativos,
        busesMantenimiento: mantenimiento,
        rutasActivas: rutas.filter(r => r.estado === 'activa').length,
        viajesHoy: totalViajes,
        viajesCompletadosHoy: completados
      });
      setTurnosDelDia(turnosEnriquecidos);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando panel de control...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
      {/* Header con Acciones Rápidas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Operaciones</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Activity size={16} className="text-green-500"/> Resumen en tiempo real del día {new Date().toLocaleDateString('es-CL')}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate('viajes')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all font-medium hover:-translate-y-0.5"
          >
            <TrendingUp size={18} /> 
            <span>Gestionar Viajes</span>
          </button>
          <button 
            onClick={() => onNavigate('buses')}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all font-medium"
          >
            <Bus size={18} /> 
            <span>Flota</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Estado de Flota */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Flota Operativa</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.busesOperativos}<span className="text-lg text-gray-400 font-normal">/{stats.busesTotal}</span></h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
              <Bus size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
            <Wrench size={12} /> {stats.busesMantenimiento} en mantenimiento
          </div>
        </div>

        {/* 2. Viajes del Día */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Viajes Hoy</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.viajesHoy}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-1000" 
              style={{ width: `${stats.viajesHoy > 0 ? (stats.viajesCompletadosHoy / stats.viajesHoy) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-medium">{stats.viajesCompletadosHoy} viajes completados ({stats.viajesHoy > 0 ? Math.round((stats.viajesCompletadosHoy / stats.viajesHoy) * 100) : 0}%)</p>
        </div>

        {/* 3. Rutas */}
        <div 
          onClick={() => onNavigate('rutas')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Rutas Activas</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats.rutasActivas}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
              <MapPin size={24} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
            Ver catálogo <ArrowRight size={12} />
          </div>
        </div>

        {/* 4. Personal */}
        <div 
          onClick={() => onNavigate('empleados')}
          className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-300 mb-1">Personal</p>
              <h3 className="text-xl font-bold">Gestionar</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl text-white">
              <Users size={24} />
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-400 flex items-center gap-2">
            Conductores • Mecánicos • Asistentes
          </p>
        </div>
      </div>

      {/* Tabla de Turnos/Viajes del Día */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Clock size={18} className="text-gray-400"/> Turnos del Día
          </h3>
          <button onClick={() => onNavigate('viajes')} className="text-sm text-blue-600 hover:underline font-medium">
            Ver calendario completo
          </button>
        </div>
        
        {turnosDelDia.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-50 rounded-full mb-3">
              <AlertCircle className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-500">No hay turnos programados para hoy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-6 py-4">Horario</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Bus</th>
                  <th className="px-6 py-4">Progreso</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {turnosDelDia.slice(0, 5).map((turno) => (
                  <tr key={turno.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-600 font-medium">
                      {turno.hora_inicio.slice(0,5)} - {turno.hora_termino.slice(0,5)}
                    </td>
                    <td className="px-6 py-4 capitalize font-medium text-gray-900">{turno.tipo_turno}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                      {turno.bus?.patente || '---'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{width: `${turno.progreso}%`}}></div>
                        </div>
                        <span className="text-xs text-gray-500">{turno.progreso}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => onNavigate('viajes')} className="text-blue-600 hover:text-blue-800 font-bold text-xs">VER</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}