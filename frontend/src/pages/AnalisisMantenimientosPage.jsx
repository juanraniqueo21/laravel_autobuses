import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, DollarSign, Calendar, TrendingUp, Power, PieChart as PieChartIcon, BarChart3, MapPin, Search, X, RefreshCw, ClipboardCheck, FileText } from 'lucide-react';
import {
  fetchBusesConMasMantenimientos,
  fetchTiposFallasMasComunes,
  fetchCostosMantenimientoPorBus,
  fetchBusesDisponiblesEmergencia,
  fetchMantenimientoAlertas,
  fetchMantenimientoTops,
  fetchBusesSOAPPorVencer,
  fetchBusesPermisoCirculacionPorVencer,
  activarBusEmergencia
} from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import MetricCard from '../components/cards/MetricCard';
import { useNotifications } from '../context/NotificationContext';

export default function AnalisisMantenimientosPage() {
  const [busesMantenimientos, setBusesMantenimientos] = useState([]);
  const [tiposFallas, setTiposFallas] = useState([]);
  const [costosMantenimiento, setCostosMantenimiento] = useState([]);
  const [busesEmergencia, setBusesEmergencia] = useState([]);
  const [alertasData, setAlertasData] = useState({ alertas: [], por_tipo: {} });
  const [topsData, setTopsData] = useState({ top_buses_fallas: [], top_modelos_fallas: [], rutas_criticas: [] });
  const [busesSOAP, setBusesSOAP] = useState([]);
  const [busesPermiso, setBusesPermiso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [activandoBus, setActivandoBus] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Tabs
  const [tabActiva, setTabActiva] = useState('general');

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [datosModal, setDatosModal] = useState({ titulo: '', datos: [] });

  const { addNotification } = useNotifications();

  useEffect(() => {
    loadData();
  }, [mes, anio, filtroActivo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtroActivo) {
        params.mes = mes;
        params.anio = anio;
      }

      const [busesData, fallasData, costosData, emergenciaData, alertas, tops, soap, permiso] = await Promise.all([
        fetchBusesConMasMantenimientos(params),
        fetchTiposFallasMasComunes(params),
        fetchCostosMantenimientoPorBus(params),
        fetchBusesDisponiblesEmergencia(params),
        fetchMantenimientoAlertas(params),
        fetchMantenimientoTops(params),
        fetchBusesSOAPPorVencer({ dias: 30 }),
        fetchBusesPermisoCirculacionPorVencer({ dias: 30 })
      ]);

      setBusesMantenimientos(busesData || []);
      setTiposFallas(fallasData || []);
      setCostosMantenimiento(costosData || []);
      setBusesEmergencia(emergenciaData || []);
      setAlertasData(alertas || { alertas: [], por_tipo: {} });
      setTopsData(tops || { top_buses_fallas: [], top_modelos_fallas: [], rutas_criticas: [] });
      setBusesSOAP(soap?.data || []);
      setBusesPermiso(permiso?.data || []);
    } catch (error) {
      console.error('Error cargando análisis de mantenimientos:', error);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de mantenimiento.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivarBusEmergencia = async (busId, patente) => {
    if (!window.confirm(`¿Está seguro de activar el bus ${patente} en modo emergencia? El mantenimiento quedará pendiente.`)) {
      return;
    }

    try {
      setActivandoBus(busId);
      await activarBusEmergencia(busId);
      addNotification('success', 'Bus Activado', `El bus ${patente} ha sido activado para servicio de emergencia.`);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error activando bus:', error);
      addNotification('error', 'Error', 'No se pudo activar el bus en emergencia.');
    } finally {
      setActivandoBus(null);
    }
  };

  const abrirModalConDatos = (titulo, datos) => {
    setDatosModal({ titulo, datos });
    setModalAbierto(true);
  };

  const getTipoServicioColor = (tipo) => {
    const colors = {
      'clasico': 'bg-gray-100 text-gray-800 border-gray-300',
      'semicama': 'bg-blue-100 text-blue-800 border-blue-300',
      'cama': 'bg-purple-100 text-purple-800 border-purple-300',
      'premium': 'bg-amber-100 text-amber-800 border-amber-300'
    };
    return colors[tipo?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
  };

  const getMesNombre = (m) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[m - 1];
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    // Si la fecha viene con formato ISO (2025-11-10T03:00:00.000000Z), extraer solo la fecha
    const fecha = fechaString.split('T')[0];
    // Convertir de YYYY-MM-DD a DD-MM-YYYY
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}-${mes}-${anio}`;
  };

  // Filtrar datos por búsqueda
  const busesMantenimientosFiltrados = busesMantenimientos.filter(bus =>
    bus.patente?.toLowerCase().includes(busqueda.toLowerCase()) ||
    bus.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
    bus.modelo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const busesEmergenciaFiltrados = busesEmergencia.filter(bus =>
    bus.patente?.toLowerCase().includes(busqueda.toLowerCase()) ||
    bus.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
    bus.modelo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Calcular métricas totales
  const totalMantenimientos = busesMantenimientos.reduce((sum, bus) => sum + (bus.total_mantenimientos || 0), 0);
  const totalCostos = costosMantenimiento.reduce((sum, bus) => sum + (bus.costo_total_mantenimiento || 0), 0);
  // Buses en mantenimiento = todos los buses en el endpoint de emergencia (que están en proceso)
  const busesEnMantenimiento = busesEmergencia.length;
  const busesActivablesEmergencia = busesEmergencia.filter(bus => bus.activable_emergencia).length;

  if (loading) {
    return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando análisis de mantenimientos...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header Compacto */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 rounded-xl p-6 text-white shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Mantenimientos</h1>
            <p className="text-sm text-orange-100 mt-1">Análisis de mantenimientos, fallas y costos de la flota</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros Mejorados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <Calendar size={18} className="text-gray-500" />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Filtrar por período</span>
          </label>

          {filtroActivo && (
            <>
              <select
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>{getMesNombre(m)}</option>
                ))}
              </select>

              <select
                value={anio}
                onChange={(e) => setAnio(parseInt(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                {[2023, 2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar bus, patente, modelo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Mantenimientos"
          value={totalMantenimientos.toLocaleString()}
          icon={Wrench}
          color="orange"
        />
        <MetricCard
          title="Buses en Mantenimiento"
          value={busesEnMantenimiento.toLocaleString()}
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          title="Costo Total"
          value={formatCurrency(totalCostos)}
          icon={DollarSign}
          color="blue"
        />
        <div
          onClick={() => abrirModalConDatos('Buses Disponibles para Emergencia', busesEmergenciaFiltrados)}
          className="cursor-pointer transform hover:scale-105 transition-transform"
        >
          <MetricCard
            title="Activables Emergencia"
            value={busesActivablesEmergencia.toLocaleString()}
            icon={Power}
            color="green"
            subtitle="Click para ver detalles"
          />
        </div>
      </div>

      {/* Sistema de Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTabActiva('general')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              tabActiva === 'general'
                ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={18} />
              Análisis General
            </div>
          </button>
          <button
            onClick={() => setTabActiva('buses')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              tabActiva === 'buses'
                ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Power size={18} />
              Buses en Mantenimiento
            </div>
          </button>
          <button
            onClick={() => setTabActiva('graficos')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              tabActiva === 'graficos'
                ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <PieChartIcon size={18} />
              Gráficos
            </div>
          </button>
          <button
            onClick={() => setTabActiva('alertas')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              tabActiva === 'alertas'
                ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} />
              Alertas y Predicción
            </div>
          </button>
        </div>
      </div>

      {/* TAB: Buses en Mantenimiento */}
      {tabActiva === 'buses' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Power size={24} className="text-green-600" />
            Buses Disponibles para Activación de Emergencia
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({busesActivablesEmergencia} de {busesEmergencia.length} activables)
            </span>
          </h2>

          {busesEmergenciaFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Bus</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo Servicio</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo Mant.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Descripción</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Fecha Inicio</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Fecha Término</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Días</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Mecánico</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Prioridad</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {busesEmergenciaFiltrados.map((bus) => (
                  <tr key={bus.bus_id} className={`hover:bg-gray-50 transition-colors ${!bus.activable_emergencia ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-900">{bus.patente}</div>
                      <div className="text-xs text-gray-500">{bus.marca} {bus.modelo} ({bus.capacidad_pasajeros} pax)</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${getTipoServicioColor(bus.tipo_servicio)}`}>
                        {bus.tipo_servicio}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${bus.tipo_mantenimiento === 'Preventivo' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {bus.tipo_mantenimiento}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 max-w-xs truncate">{bus.descripcion}</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-700">
                      {formatFecha(bus.fecha_inicio)}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-700">
                      {formatFecha(bus.fecha_termino_estimada)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm font-semibold text-gray-900">
                        {bus.dias_en_mantenimiento}d
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{bus.mecanico_asignado || 'N/A'}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                        bus.prioridad_mantenimiento === 'baja' ? 'bg-green-100 text-green-800' :
                        bus.prioridad_mantenimiento === 'media' ? 'bg-yellow-100 text-yellow-800' :
                        bus.prioridad_mantenimiento === 'alta' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bus.prioridad_mantenimiento}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {bus.activable_emergencia ? (
                        <button
                          onClick={() => handleActivarBusEmergencia(bus.bus_id, bus.patente)}
                          disabled={activandoBus === bus.bus_id}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 mx-auto"
                        >
                          {activandoBus === bus.bus_id ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Activando...
                            </>
                          ) : (
                            <>
                              <Power size={14} />
                              Activar
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No activable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay buses que coincidan con la búsqueda
            </div>
          )}
        </div>
      )}

      {/* TAB: Análisis General */}
      {tabActiva === 'general' && (
        <>
          {/* Buses con Más Mantenimientos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp size={24} className="text-orange-600" />
              Top Buses con Más Mantenimientos
            </h2>

            {busesMantenimientosFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Patente</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Bus</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo Servicio</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Total</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Preventivos</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Correctivos</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">En Proceso</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Costo Total</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {busesMantenimientosFiltrados.map((bus) => (
                <tr key={bus.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-gray-900">{bus.patente}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{bus.marca} {bus.modelo}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${getTipoServicioColor(bus.tipo_servicio)}`}>
                      {bus.tipo_servicio}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded font-bold">
                      {bus.total_mantenimientos}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-blue-700 font-semibold">{bus.preventivos}</td>
                  <td className="px-4 py-4 text-right text-red-700 font-semibold">{bus.correctivos}</td>
                  <td className="px-4 py-4 text-right text-yellow-700 font-semibold">{bus.en_proceso}</td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900">{formatCurrency(bus.costo_total_mantenimientos)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      bus.estado_bus === 'operativo' ? 'bg-green-100 text-green-800' :
                      bus.estado_bus === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bus.estado_bus}
                    </span>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay buses que coincidan con la búsqueda
              </div>
            )}
          </div>

          {/* Tipos de Fallas Más Comunes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-600" />
            Tipos de Fallas Más Comunes
          </h2>

          <div className="space-y-3">
            {tiposFallas.map((falla, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{falla.tipo_falla}</h3>
                    <p className="text-sm text-gray-500 mt-1">Ocurrencias: {falla.cantidad}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                    #{index + 1}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500">Promedio</div>
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(falla.costo_promedio)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Mínimo</div>
                    <div className="text-sm font-semibold text-green-700">{formatCurrency(falla.costo_minimo)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Máximo</div>
                    <div className="text-sm font-semibold text-red-700">{formatCurrency(falla.costo_maximo)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tiposFallas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay datos de fallas para el período seleccionado
            </div>
          )}
        </div>

        {/* Costos de Mantenimiento por Bus */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign size={24} className="text-blue-600" />
            Top Costos de Mantenimiento
          </h2>

          <div className="space-y-3">
            {costosMantenimiento.slice(0, 10).map((bus, index) => (
              <div key={bus.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{bus.patente}</h3>
                    <p className="text-sm text-gray-500">{bus.marca} {bus.modelo}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${getTipoServicioColor(bus.tipo_servicio)}`}>
                    {bus.tipo_servicio}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Costo Total:</span>
                    <span className="text-lg font-bold text-blue-700">{formatCurrency(bus.costo_total_mantenimiento)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Promedio por mantenimiento:</span>
                    <span className="font-semibold text-gray-700">{formatCurrency(bus.costo_promedio_mantenimiento)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>Total mantenimientos:</span>
                    <span className="font-semibold text-gray-700">{bus.total_mantenimientos}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {costosMantenimiento.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay datos de costos para el período seleccionado
            </div>
          )}
        </div>
      </div>

      {/* NUEVAS SECCIONES DE ANÁLISIS CON GRÁFICOS */}

      {/* Distribución de Alertas de Mantenimiento */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <PieChartIcon size={24} className="text-purple-600" />
          Distribución de Alertas de Mantenimiento
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de torta */}
          <div className="flex justify-center items-center">
            {alertasData.por_tipo && Object.keys(alertasData.por_tipo).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Cambio de Aceite', value: alertasData.por_tipo.cambio_aceite || 0 },
                      { name: 'Revisión Técnica', value: alertasData.por_tipo.revision_tecnica || 0 },
                      { name: 'Mantenimiento', value: alertasData.por_tipo.mantenimiento || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-12">No hay alertas en este período</div>
            )}
          </div>

          {/* Lista de alertas */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {alertasData.alertas && alertasData.alertas.length > 0 ? (
              alertasData.alertas.slice(0, 5).map((alerta, index) => (
                <div key={index} className={`border-l-4 p-3 rounded ${
                  alerta.nivel === 'critico' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                }`}>
                  <div className="font-bold text-sm">{alerta.mensaje}</div>
                  <div className="text-xs text-gray-600 mt-1">{alerta.detalle}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">No hay alertas activas</div>
            )}
            {alertasData.alertas && alertasData.alertas.length > 5 && (
              <div className="text-center text-sm text-gray-500 mt-2">
                Y {alertasData.alertas.length - 5} alertas más...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Buses con Más Fallas */}
      {topsData.top_buses_fallas && topsData.top_buses_fallas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 size={24} className="text-red-600" />
            Top Buses con Más Fallas (Mantenimientos Correctivos)
          </h2>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topsData.top_buses_fallas.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="patente" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_fallas" fill="#ef4444" name="Total de Fallas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Análisis por Modelo y Rutas Críticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Fallas por Modelo */}
        {topsData.top_modelos_fallas && topsData.top_modelos_fallas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <PieChartIcon size={24} className="text-indigo-600" />
              Fallas por Modelo de Bus
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topsData.top_modelos_fallas.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ marca_modelo, total_fallas }) => `${marca_modelo}: ${total_fallas}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total_fallas"
                >
                  {topsData.top_modelos_fallas.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Rutas Críticas */}
        {topsData.rutas_criticas && topsData.rutas_criticas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin size={24} className="text-rose-600" />
              Rutas Críticas (Más Incidentes)
            </h2>

            <div className="space-y-3">
              {topsData.rutas_criticas.map((ruta, index) => (
                <div key={ruta.ruta_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{ruta.nombre}</h3>
                      <p className="text-sm text-gray-500">{ruta.origen} → {ruta.destino}</p>
                    </div>
                    <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500">Total Incidentes</div>
                      <div className="text-lg font-semibold text-rose-700">{ruta.total_incidentes}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Incidentes Graves</div>
                      <div className="text-lg font-semibold text-red-700">{ruta.incidentes_graves}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {topsData.rutas_criticas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay rutas críticas en este período
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rutas con Más Fallas - Chart */}
      {topsData.rutas_criticas && topsData.rutas_criticas.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin size={24} className="text-rose-600" />
            Rutas con Más Fallas de Mantenimiento
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topsData.rutas_criticas.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_incidentes" fill="#f43f5e" name="Total Incidentes" />
              <Bar dataKey="incidentes_graves" fill="#dc2626" name="Incidentes Graves" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
        </>
      )}

      {/* TAB: Alertas y Predicción */}
      {tabActiva === 'alertas' && (
        <>
          {/* Alertas Críticas Clickeables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Alerta SOAP por Vencer */}
            <div
              onClick={() => {
                abrirModalConDatos('Buses con SOAP por Vencer', busesSOAP);
              }}
              className="bg-white rounded-lg shadow-sm border-2 border-orange-300 p-6 cursor-pointer hover:shadow-lg hover:border-orange-500 transition-all transform hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <ClipboardCheck className="text-orange-600" size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">SOAP por Vencer</h3>
                    <p className="text-sm text-gray-600">Próximos 30 días</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-2xl font-bold">
                  {busesSOAP.length}
                </span>
              </div>
              <p className="text-sm text-gray-600 border-t border-gray-200 pt-4">
                Click para ver la lista completa de buses que requieren renovación de SOAP
              </p>
            </div>

            {/* Alerta Permiso Circulación por Vencer */}
            <div
              onClick={() => {
                abrirModalConDatos('Buses con Permiso de Circulación por Vencer', busesPermiso);
              }}
              className="bg-white rounded-lg shadow-sm border-2 border-red-300 p-6 cursor-pointer hover:shadow-lg hover:border-red-500 transition-all transform hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <FileText className="text-red-600" size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Permiso Circulación</h3>
                    <p className="text-sm text-gray-600">Por vencer</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-2xl font-bold">
                  {busesPermiso.length}
                </span>
              </div>
              <p className="text-sm text-gray-600 border-t border-gray-200 pt-4">
                Click para ver la lista completa de buses con permisos próximos a vencer
              </p>
            </div>
          </div>

          {/* Distribución de Alertas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertTriangle size={24} className="text-purple-600" />
              Distribución de Alertas de Mantenimiento
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {alertasData.por_tipo && Object.keys(alertasData.por_tipo).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Cambio de Aceite', value: alertasData.por_tipo.cambio_aceite || 0 },
                        { name: 'Revisión Técnica', value: alertasData.por_tipo.revision_tecnica || 0 },
                        { name: 'Mantenimiento', value: alertasData.por_tipo.mantenimiento || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-12">No hay alertas en este período</div>
              )}

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {alertasData.alertas && alertasData.alertas.length > 0 ? (
                  alertasData.alertas.slice(0, 10).map((alerta, index) => (
                    <div key={index} className={`border-l-4 p-3 rounded ${
                      alerta.nivel === 'critico' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                    }`}>
                      <div className="font-bold text-sm">{alerta.mensaje}</div>
                      <div className="text-xs text-gray-600 mt-1">{alerta.detalle}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">No hay alertas activas</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB: Gráficos */}
      {tabActiva === 'graficos' && (
        <>
          {/* Top Buses con Más Fallas */}
          {topsData.top_buses_fallas && topsData.top_buses_fallas.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 size={24} className="text-red-600" />
                Top Buses con Más Fallas
              </h2>

              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topsData.top_buses_fallas.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="patente" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_fallas" fill="#ef4444" name="Cantidad de Fallas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Análisis por Modelo y Rutas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Fallas por Modelo */}
            {topsData.top_modelos_fallas && topsData.top_modelos_fallas.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <PieChartIcon size={24} className="text-indigo-600" />
                  Fallas por Modelo de Bus
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topsData.top_modelos_fallas.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ marca_modelo, total_fallas }) => `${marca_modelo}: ${total_fallas}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="total_fallas"
                    >
                      {topsData.top_modelos_fallas.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Rutas con Más Fallas - Chart */}
            {topsData.rutas_criticas && topsData.rutas_criticas.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin size={24} className="text-rose-600" />
                  Rutas con Más Fallas
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topsData.rutas_criticas.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_incidentes" fill="#f43f5e" name="Total Incidentes" />
                    <Bar dataKey="incidentes_graves" fill="#dc2626" name="Incidentes Graves" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Detalles */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-orange-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{datosModal.titulo}</h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {datosModal.datos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
              ) : (
                <div className="space-y-3">
                  {datosModal.datos.map((bus, index) => (
                    <div key={bus.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Patente</p>
                          <p className="font-bold text-lg">{bus.patente}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Bus</p>
                          <p className="font-semibold">{bus.marca} {bus.modelo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tipo Servicio</p>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getTipoServicioColor(bus.tipo_servicio)}`}>
                            {bus.tipo_servicio}
                          </span>
                        </div>
                        {bus.total_mantenimientos !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500">Mantenimientos</p>
                            <p className="font-semibold">{bus.total_mantenimientos}</p>
                          </div>
                        )}
                        {bus.estado_bus && (
                          <div>
                            <p className="text-xs text-gray-500">Estado</p>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              bus.estado_bus === 'operativo' ? 'bg-green-100 text-green-800' :
                              bus.estado_bus === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {bus.estado_bus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}