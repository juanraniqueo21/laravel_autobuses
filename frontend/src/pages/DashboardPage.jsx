import React, { useState, useEffect } from 'react';
import {
  Bus,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Clock,
  Activity,
  Users,
  ShieldAlert,
  PiggyBank,
  Gauge,
} from 'lucide-react';
import { fetchBuses, fetchRutas, fetchTurnos, fetchViajesPorTurno, fetchDashboardOperativo, fetchPuntualidadSLA } from '../services/api';

export default function DashboardPage({ onNavigate }) {
  // Estado Operativo (local)
  const [stats, setStats] = useState({
    busesTotal: 0,
    busesOperativos: 0,
    busesMantenimiento: 0,
    rutasActivas: 0,
    viajesHoy: 0,
    viajesCompletadosHoy: 0,
  });
  const [turnosDelDia, setTurnosDelDia] = useState([]);

  // Estado BI (backend)
  const [biData, setBiData] = useState(null);
  const [slaData, setSlaData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtro de fecha para BI (últimos 30 días por defecto)
  const [filtrosBi] = useState({
    fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [buses, rutas, turnos, biRes, slaRes] = await Promise.all([
        fetchBuses(),
        fetchRutas(),
        fetchTurnos({ fecha: today }),
        fetchDashboardOperativo(filtrosBi).catch(() => null),
        fetchPuntualidadSLA(filtrosBi).catch(() => null),
      ]);

      if (biRes) setBiData(biRes);
      if (slaRes) setSlaData(slaRes);

      const operativos = buses.filter((b) => b.estado === 'operativo' || b.estado === 'activo').length;
      const mantenimiento = buses.filter((b) => b.estado === 'mantenimiento').length;

      let totalViajes = 0;
      let completados = 0;

      const turnosEnriquecidos = await Promise.all(
        turnos.map(async (turno) => {
          try {
            const viajes = await fetchViajesPorTurno(turno.id);
            totalViajes += viajes.length;
            const completadosTurno = viajes.filter((v) => v.estado === 'completado').length;
            completados += completadosTurno;

            const progreso = viajes.length > 0 ? Math.round((completadosTurno / viajes.length) * 100) : 0;

            return { ...turno, viajesTotales: viajes.length, viajesCompletados: completadosTurno, progreso };
          } catch (e) {
            return { ...turno, viajesTotales: 0, viajesCompletados: 0, progreso: 0 };
          }
        })
      );

      turnosEnriquecidos.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

      setStats({
        busesTotal: buses.length,
        busesOperativos: operativos,
        busesMantenimiento: mantenimiento,
        rutasActivas: rutas.filter((r) => r.estado === 'activa').length,
        viajesHoy: totalViajes,
        viajesCompletadosHoy: completados,
      });
      setTurnosDelDia(turnosEnriquecidos);
    } catch (error) {
      console.error('Error general dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatoDinero = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val || 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Sincronizando operaciones...</p>
        </div>
      </div>
    );
  }

  const alertas = biData?.alertas || [];
  const criticos = alertas.filter((a) => (a.nivel || '').toLowerCase() === 'critico').length;
  const finanzas = alertas.filter((a) => (a.categoria || '').toLowerCase() === 'finanzas').length;
  const operacion = alertas.filter((a) => (a.categoria || '').toLowerCase() === 'operacion').length;
  const seguridad = alertas.filter((a) => (a.categoria || '').toLowerCase() === 'seguridad').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50/30 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Panel de Control Gerencial <Activity className="text-blue-600" size={24} />
          </h1>
          <p className="text-gray-500 text-sm mt-1">Visión unificada: Financiera, Operativa y de Seguridad.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('viajes')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md shadow-blue-600/20 flex items-center gap-2 font-medium transition-all text-sm"
          >
            <TrendingUp size={16} /> Gestión Viajes
          </button>
          <button
            onClick={() => onNavigate('analisis-mantenimientos')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md shadow-indigo-600/20 flex items-center gap-2 font-medium transition-all text-sm"
          >
            <Wrench size={16} /> Análisis Mantenimiento
          </button>
          <button
            onClick={() => onNavigate('analisis-rrhh')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-md shadow-emerald-600/20 flex items-center gap-2 font-medium transition-all text-sm"
          >
            <Users size={16} /> Análisis RRHH
          </button>
        </div>
      </div>

      {/* ALERTAS Y OPERACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Centro de Alertas */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={18} />
                Centro de Alertas Proactivas
              </h3>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full border border-red-200">
                {alertas.length} requieren atención
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100 text-xs">
                <ShieldAlert size={14} className="text-red-500" />
                <div>
                  <p className="font-semibold text-red-700">Críticos</p>
                  <p className="text-red-600">{criticos}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                <PiggyBank size={14} className="text-amber-500" />
                <div>
                  <p className="font-semibold text-amber-700">Finanzas</p>
                  <p className="text-amber-600">{finanzas}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100 text-xs">
                <Gauge size={14} className="text-blue-500" />
                <div>
                  <p className="font-semibold text-blue-700">Operación</p>
                  <p className="text-blue-600">{operacion}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100 text-xs">
                <ShieldAlert size={14} className="text-emerald-500" />
                <div>
                  <p className="font-semibold text-emerald-700">Seguridad</p>
                  <p className="text-emerald-600">{seguridad}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[350px]">
            {!alertas.length ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 min-h-[200px]">
                <Activity size={40} className="mb-2 opacity-20" />
                <p>Operación normal. Sin alertas críticas.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {alertas.map((alerta, idx) => {
                  const nivel = (alerta.nivel || '').toLowerCase();
                  const badge =
                    nivel === 'critico'
                      ? 'bg-red-50 text-red-700 border border-red-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-100';
                  const categoria = (alerta.categoria || '').toLowerCase();
                  const chipColor =
                    categoria === 'finanzas'
                      ? 'bg-amber-100 text-amber-700'
                      : categoria === 'seguridad'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700';
                  return (
                    <div key={idx} className="group p-4 hover:bg-gray-50 transition-colors flex gap-4 items-start">
                      <div className={`w-1.5 h-12 rounded-full mt-1 ${nivel === 'critico' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                      <div className="flex-1">
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${badge}`}>{alerta.titulo}</span>
                            {alerta.ruta && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">Ruta {alerta.ruta}</span>
                            )}
                            {alerta.bus && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">Bus {alerta.bus}</span>
                            )}
                            <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${chipColor}`}>
                              {alerta.categoria || 'Operación'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                            <Clock size={12} /> {alerta.fecha}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-snug font-medium">{alerta.mensaje}</p>
                        {alerta.monto && (
                          <p className="text-xs text-red-600 font-semibold mt-1">
                            Pérdida estimada: {alerta.monto_formateado || formatoDinero(alerta.monto)}
                          </p>
                        )}
                        {alerta.accion_recomendada && (
                          <div className="mt-2 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-[11px] px-2 py-1 rounded border border-indigo-100">
                            <Wrench size={12} /> {alerta.accion_recomendada}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Operación del día */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" /> Turnos Hoy
            </h3>
            <button onClick={() => onNavigate('viajes')} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Ver Todo
            </button>
          </div>
          <div className="flex-1 p-2 overflow-y-auto max-h-[350px]">
            {turnosDelDia.length === 0 ? (
              <div className="text-center p-8 text-gray-400 text-sm">No hay turnos hoy.</div>
            ) : (
              <div className="space-y-3">
                {turnosDelDia.map((turno) => (
                  <div key={turno.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {turno.hora_inicio.slice(0, 5)}
                      </span>
                      <span className="text-xs bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 capitalize">
                        {turno.tipo_turno}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-800">{turno.bus?.patente || 'Sin Bus'}</p>
                      <span className={`text-xs font-bold ${turno.progreso === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                        {turno.progreso}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full ${turno.progreso === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${turno.progreso}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
