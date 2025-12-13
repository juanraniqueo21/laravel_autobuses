import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, DollarSign, Calendar, TrendingUp, Power, PieChart as PieChartIcon, BarChart3, MapPin, Search, X, RefreshCw, ClipboardCheck, FileText, ArrowRight } from 'lucide-react';
import {
  fetchBusesConMasMantenimientos,
  fetchBusesConMasMantenimientosPdf,
  fetchTiposFallasMasComunes,
  fetchCostosMantenimientoPorBus,
  fetchBusesDisponiblesEmergencia,
  fetchMantenimientoAlertas,
  fetchMantenimientoTops,
  fetchBusesSOAPPorVencer,
  fetchBusesPermisoCirculacionPorVencer,
  activarBusEmergencia,
  fetchHistorialReportes
} from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MetricCard from '../components/cards/MetricCard';
import { useNotifications } from '../context/NotificationContext';

export default function AnalisisMantenimientosPage() {
  // --- ESTADOS DE DATOS ---
  const [busesMantenimientos, setBusesMantenimientos] = useState([]);
  const [tiposFallas, setTiposFallas] = useState([]);
  const [costosMantenimiento, setCostosMantenimiento] = useState([]);
  const [busesEmergencia, setBusesEmergencia] = useState([]);
  const [alertasData, setAlertasData] = useState({ alertas: [], por_tipo: {} });
  const [topsData, setTopsData] = useState({ top_buses_fallas: [], top_modelos_fallas: [], rutas_criticas: [] });
  const [busesSOAP, setBusesSOAP] = useState([]);
  const [busesPermiso, setBusesPermiso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historialReportes, setHistorialReportes] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  
  // Filtros
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [busqueda, setBusqueda] = useState('');

  // UI States
  const [activandoBus, setActivandoBus] = useState(null);
  const [tabActiva, setTabActiva] = useState('general'); // general, taller, costos, alertas
  const [modalAbierto, setModalAbierto] = useState(false);
  const [datosModal, setDatosModal] = useState({ titulo: '', datos: [] });
  const [descargandoPdf, setDescargandoPdf] = useState(false);

  const { addNotification } = useNotifications();

  // --- CARGA DE DATOS ---
  useEffect(() => {
    loadData();
  }, [mes, anio]);

  const getFiltroParams = () => ({
    mes,
    anio,
  });

  const descargarBlob = (blob, nombreArchivo) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params = getFiltroParams();
      const historialPromise = fetchHistorialReportes({
        tipo: 'mantenimientos',
        mes,
        anio,
      });

      const [busesData, fallasData, costosData, emergenciaData, alertas, tops, historial] = await Promise.all([
        fetchBusesConMasMantenimientos(params),
        fetchTiposFallasMasComunes(params),
        fetchCostosMantenimientoPorBus(params),
        fetchBusesDisponiblesEmergencia(params),
        fetchMantenimientoAlertas(params),
        fetchMantenimientoTops(params),
        historialPromise
      ]);

      setBusesMantenimientos(busesData || []);
      setTiposFallas(fallasData || []);
      setCostosMantenimiento(costosData || []);
      setBusesEmergencia(emergenciaData || []);
      setAlertasData(alertas || { alertas: [], por_tipo: {} });
      setTopsData(tops || { top_buses_fallas: [], top_modelos_fallas: [], rutas_criticas: [] });
      setHistorialReportes((historial?.data) || []);

      // Carga tolerante a fallos para SOAP y Permisos
      try {
        const soap = await fetchBusesSOAPPorVencer({ dias: 30 });
        setBusesSOAP(soap?.data || []);
      } catch (e) { console.warn("Error SOAP", e); setBusesSOAP([]); }

      try {
        const permiso = await fetchBusesPermisoCirculacionPorVencer({ dias: 30 });
        setBusesPermiso(permiso?.data || []);
      } catch (e) { console.warn("Error Permiso", e); setBusesPermiso([]); }

    } catch (error) {
      console.error(error);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de mantenimiento.');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarAnalisisMantenimientos = async () => {
    try {
      setDescargandoPdf(true);
      const params = getFiltroParams();
      const blob = await fetchBusesConMasMantenimientosPdf(params);
      const nombreArchivo = `analisis-mantenimientos-${new Date().toISOString().slice(0, 10)}.pdf`;
      descargarBlob(blob, nombreArchivo);
      addNotification('success', 'Reporte generado', 'Se descargó el PDF de mantenimiento.');
    } catch (error) {
      console.error(error);
      addNotification('error', 'Error', 'No se pudo descargar el PDF de mantenimiento.');
    } finally {
      setDescargandoPdf(false);
    }
  };

  const handleActivarBusEmergencia = async (busId, patente) => {
    if (!window.confirm(`¿Está seguro de activar el bus ${patente} en modo emergencia?`)) return;
    try {
      setActivandoBus(busId);
      await activarBusEmergencia(busId);
      addNotification('success', 'Bus Activado', `El bus ${patente} ha sido activado.`);
      loadData();
    } catch (error) {
      addNotification('error', 'Error', 'No se pudo activar el bus.');
    } finally {
      setActivandoBus(null);
    }
  };

  // --- HELPERS ---
  const abrirModalConDatos = (titulo, datos) => {
    setDatosModal({ titulo, datos });
    setModalAbierto(true);
  };

  const getTipoServicioColor = (tipo) => {
    const colors = { 'clasico': 'bg-gray-100 text-gray-800', 'semicama': 'bg-blue-100 text-blue-800', 'cama': 'bg-purple-100 text-purple-800', 'premium': 'bg-amber-100 text-amber-800' };
    return colors[tipo?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
  const getMesNombre = (m) => ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][m - 1];
  const formatFecha = (f) => f ? f.split('T')[0].split('-').reverse().join('-') : 'N/A';
  const formatHistorialFecha = (value) =>
    value ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-';
  const formatHistorialMes = (entry) => {
    if (entry?.mes && entry?.anio) {
      return `${getMesNombre(Number(entry.mes))} ${entry.anio}`;
    }
    return 'Mes desconocido';
  };
  const formatHistorialUsuario = (entry) => {
    const nombre = entry?.user?.nombre;
    const apellido = entry?.user?.apellido;
    if (nombre || apellido) {
      return `${nombre ?? ''} ${apellido ?? ''}`.trim();
    }
    if (entry.user_id) {
      return `Usuario ${entry.user_id}`;
    }
    return 'Sistema';
  };

  // --- FILTROS ---
  const busesEmergenciaFiltrados = busesEmergencia.filter(bus => 
    bus.patente?.toLowerCase().includes(busqueda.toLowerCase()) || 
    bus.modelo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalMantenimientos = busesMantenimientos.reduce((sum, bus) => sum + (bus.total_mantenimientos || 0), 0);
  const totalCostos = costosMantenimiento.reduce((sum, bus) => sum + (bus.costo_total_mantenimiento || 0), 0);
  const busesActivables = busesEmergencia.filter(bus => bus.activable_emergencia).length;

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando datos...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* HEADER Y FILTROS COMPACTO */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Wrench className="text-orange-600" /> Dashboard Mantenimiento
          </h1>
          <p className="text-xs text-gray-500">Gestión de flota y reparaciones</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Mes:</span>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="text-sm border-gray-300 rounded-lg py-1.5 focus:ring-orange-500">
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{getMesNombre(i+1)}</option>)}
            </select>
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="text-sm border-gray-300 rounded-lg py-1.5 focus:ring-orange-500">
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar bus..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg w-48 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <button onClick={loadData} className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors">
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleDescargarAnalisisMantenimientos}
            disabled={descargandoPdf}
            className="flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-dashed border-orange-300 bg-white text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-40"
          >
            <FileText size={16} />
            <span>{descargandoPdf ? 'Generando...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg px-2 overflow-x-auto">
        {[
          { id: 'general', label: 'Resumen General', icon: BarChart3 },
          { id: 'taller', label: 'Flota en Taller', icon: Power },
          { id: 'costos', label: 'Costos y Fallas', icon: DollarSign },
          { id: 'alertas', label: 'Alertas Predictivas', icon: AlertTriangle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tabActiva === tab.id 
                ? 'border-orange-600 text-orange-700 bg-orange-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- PESTAÑA 1: GENERAL --- */}
      {tabActiva === 'general' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard title="Total Mantenimientos" value={totalMantenimientos} icon={Wrench} color="orange" />
            <MetricCard title="Buses en Taller" value={busesEmergencia.length} icon={AlertTriangle} color="red" />
            <MetricCard title="Costo Total" value={formatCurrency(totalCostos)} icon={DollarSign} color="blue" />
            <div onClick={() => setTabActiva('taller')} className="cursor-pointer hover:opacity-90 transition-opacity">
              <MetricCard title="Activables Emergencia" value={busesActivables} icon={Power} color="green" subtitle="Ver disponibles" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">Alertas Activas</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: 'Aceite', value: alertasData.por_tipo?.cambio_aceite || 0 },
                      { name: 'Técnica', value: alertasData.por_tipo?.revision_tecnica || 0 },
                      { name: 'Mant.', value: alertasData.por_tipo?.mantenimiento || 0 }
                    ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                      <Cell fill="#f59e0b" /><Cell fill="#3b82f6" /><Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">Top 5 Modelos con Fallas</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topsData.top_modelos_fallas.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="marca_modelo" type="category" width={120} tick={{fontSize: 11}} />
                    <Tooltip />
                    <Bar dataKey="total_fallas" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} name="Fallas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PESTAÑA 2: TALLER (Top 5 + Ver más) --- */}
      {tabActiva === 'taller' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Estado de Flota en Taller</h2>
            <div className="flex gap-3 items-center">
              <span className="text-sm text-gray-500">{busesEmergenciaFiltrados.length} vehículos</span>
              {busesEmergenciaFiltrados.length > 5 && (
                <button onClick={() => abrirModalConDatos('Lista Completa Taller', busesEmergencia)} className="text-blue-600 text-xs font-bold hover:underline bg-blue-50 px-3 py-1 rounded">
                  Ver Todos
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Bus</th>
                  <th className="px-4 py-3 text-left">Problema</th>
                  <th className="px-4 py-3 text-center">Ingreso</th>
                  <th className="px-4 py-3 text-center">Días</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {busesEmergenciaFiltrados.slice(0, 5).map((bus) => (
                  <tr key={bus.bus_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {bus.patente} <span className="text-gray-400 font-normal">({bus.modelo})</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" title={bus.descripcion}>{bus.descripcion}</td>
                    <td className="px-4 py-3 text-center">{formatFecha(bus.fecha_inicio)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${bus.dias_en_mantenimiento > 7 ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                        {bus.dias_en_mantenimiento}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {bus.activable_emergencia ? (
                        <button 
                          onClick={() => handleActivarBusEmergencia(bus.bus_id, bus.patente)}
                          disabled={activandoBus === bus.bus_id}
                          className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded text-xs font-bold transition-colors"
                        >
                          {activandoBus === bus.bus_id ? '...' : 'Activar'}
                        </button>
                      ) : <span className="text-xs text-gray-400 italic">No disponible</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {busesEmergenciaFiltrados.length === 0 && <div className="p-8 text-center text-gray-400">No hay buses en taller</div>}
          </div>
        </div>
      )}

      {/* --- PESTAÑA 3: COSTOS Y FALLAS (Top 5 + Ver más) --- */}
      {tabActiva === 'costos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {/* Top 5 Fallas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Top 5 Tipos de Fallas</h3>
              <button onClick={() => abrirModalConDatos('Todas las Fallas', tiposFallas)} className="text-xs text-blue-600 font-bold hover:underline">Ver todas</button>
            </div>
            <div className="space-y-3">
              {tiposFallas.slice(0, 5).map((falla, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{falla.tipo_falla}</p>
                    <p className="text-xs text-gray-500">{falla.cantidad} incidentes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{formatCurrency(falla.costo_maximo)}</p>
                    <p className="text-xs text-gray-400">Costo Máx</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 5 Costos por Bus */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Top 5 Gastos por Bus</h3>
              <button onClick={() => abrirModalConDatos('Costos por Bus', costosMantenimiento)} className="text-xs text-blue-600 font-bold hover:underline">Ver todos</button>
            </div>
            <div className="space-y-3">
              {costosMantenimiento.slice(0, 5).map((bus, i) => (
                <div key={i} className="flex justify-between items-center p-3 border-l-4 border-l-blue-500 bg-gray-50 rounded-r-lg">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{bus.patente}</p>
                    <p className="text-xs text-gray-500">{bus.modelo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-800">{formatCurrency(bus.costo_total_mantenimiento)}</p>
                    <p className="text-xs text-gray-500">{bus.total_mantenimientos} entradas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- PESTAÑA 4: ALERTAS --- */}
      {tabActiva === 'alertas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {/* SOAP */}
          <div onClick={() => abrirModalConDatos('SOAP por Vencer', busesSOAP)} className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm hover:shadow-md cursor-pointer transition-all">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">SOAP por Vencer</h3>
                <p className="text-sm text-gray-500">Próximos 30 días</p>
              </div>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold text-xl">{busesSOAP.length}</span>
            </div>
            <div className="mt-4 text-sm text-orange-600 font-medium flex items-center">Ver listado <ArrowRight size={16} className="ml-1"/></div>
          </div>

          {/* Permiso Circulación */}
          <div onClick={() => abrirModalConDatos('Rev. Técnica por Vencer', busesPermiso)} className="bg-white p-6 rounded-xl border border-red-200 shadow-sm hover:shadow-md cursor-pointer transition-all">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Revisión Técnica</h3>
                <p className="text-sm text-gray-500">Por vencer</p>
              </div>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold text-xl">{busesPermiso.length}</span>
            </div>
            <div className="mt-4 text-sm text-red-600 font-medium flex items-center">Ver listado <ArrowRight size={16} className="ml-1"/></div>
          </div>

          {/* Listado de alertas generales */}
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4">Todas las Alertas Operativas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {alertasData.alertas.map((alerta, i) => (
                <div key={i} className={`p-3 rounded border-l-4 ${alerta.nivel === 'critico' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
                  <p className="font-bold text-sm text-gray-800">{alerta.mensaje}</p>
                  <p className="text-xs text-gray-600 mt-1">{alerta.detalle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-gray-800">Historial de descargas</p>
            <p className="text-xs text-gray-500">Últimos archivos generados para este mes</p>
          </div>
          <button
            onClick={() => setMostrarHistorial(prev => !prev)}
            className="text-xs font-semibold uppercase tracking-wide text-orange-600 px-3 py-1 border border-orange-100 rounded-full hover:bg-orange-50 transition"
          >
            {mostrarHistorial ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {mostrarHistorial && (
          <div className="mt-3 space-y-2">
            {historialReportes.length === 0 ? (
              <p className="text-xs text-gray-400">Aún no hay descargas registradas.</p>
            ) : (
              historialReportes.map(entry => (
                <div key={`hist-${entry.id}`} className="flex flex-col gap-1 rounded-lg border border-gray-100 px-3 py-2 bg-gray-50 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {formatHistorialMes(entry)} · {entry.archivo || 'Reporte mensual'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Generado {formatHistorialFecha(entry.created_at)} · {formatHistorialUsuario(entry)}
                      {entry.filtros?.tipo_mantenimiento ? ` · ${entry.filtros.tipo_mantenimiento}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase text-orange-600">{entry.tipo}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* --- MODAL DE DETALLE --- */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800">{datosModal.titulo}</h3>
              <button onClick={() => setModalAbierto(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96">
                {JSON.stringify(datosModal.datos, null, 2)}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
