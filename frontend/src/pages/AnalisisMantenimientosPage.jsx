import React, { useState, useEffect } from 'react';
import { 
  Wrench, AlertTriangle, DollarSign, Calendar, Power, 
  BarChart3, Search, X, RefreshCw, FileText, ArrowRight,
  Filter, ChevronDown, PieChart as PieChartIcon 
} from 'lucide-react';
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
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import MetricCard from '../components/cards/MetricCard';
import { useNotifications } from '../context/NotificationContext';

// --- UTILIDADES ---
const formatCurrency = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
const formatFecha = (f) => f ? f.split('T')[0].split('-').reverse().join('-') : 'N/A';
const getMesNombre = (m) => ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][m - 1];
const formatHistorialFecha = (value) => value ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-';
const formatHistorialMes = (entry) => (entry?.mes && entry?.anio) ? `${getMesNombre(Number(entry.mes))} ${entry.anio}` : 'Mes desconocido';
const formatHistorialUsuario = (entry) => {
  const nombre = entry?.user?.nombre;
  const apellido = entry?.user?.apellido;
  return (nombre || apellido) ? `${nombre ?? ''} ${apellido ?? ''}`.trim() : (entry.user_id ? `Usuario ${entry.user_id}` : 'Sistema');
};

// Calcula días restantes para vencimiento
const getDiasRestantes = (fecha) => {
  if (!fecha) return 0;
  const hoy = new Date();
  const vencimiento = new Date(fecha);
  const diffTime = vencimiento - hoy;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

export default function AnalisisMantenimientosPage() {
  // --- ESTADOS DE DATOS ---
  const [busesMantenimientos, setBusesMantenimientos] = useState([]);
  const [tiposFallas, setTiposFallas] = useState([]);
  const [costosMantenimiento, setCostosMantenimiento] = useState([]);
  const [busesEmergencia, setBusesEmergencia] = useState([]);
  const [alertasData, setAlertasData] = useState({ alertas: [], por_tipo: {} });
  const [topsData, setTopsData] = useState({ top_buses_fallas: [], top_modelos_fallas: [], rutas_criticas: [] });
  // Mantenemos estos estados por si quieres usarlos en otro lugar o el backend los envía
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
  const [tabActiva, setTabActiva] = useState('general'); 
  const [modalAbierto, setModalAbierto] = useState(false);
  const [datosModal, setDatosModal] = useState({ titulo: '', datos: [], tipo: null });
  const [descargandoPdf, setDescargandoPdf] = useState(false);

  const { addNotification } = useNotifications();

  // --- CARGA DE DATOS ---
  useEffect(() => {
    loadData();
  }, [mes, anio]);

  const getFiltroParams = () => ({ mes, anio });

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
      const historialPromise = fetchHistorialReportes({ tipo: 'mantenimientos', mes, anio });

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

  // --- HELPERS Y FILTROS ---
  const abrirModalConDatos = (titulo, datos, tipo = null) => {
    setDatosModal({ titulo, datos, tipo });
    setModalAbierto(true);
  };

  const busesEmergenciaFiltrados = busesEmergencia.filter(bus => 
    bus.patente?.toLowerCase().includes(busqueda.toLowerCase()) || 
    bus.modelo?.toLowerCase().includes(busqueda.toLowerCase())
  );
  
  const tiposFallasFiltrados = tiposFallas.filter(f => f.tipo_falla.toLowerCase().includes(busqueda.toLowerCase()));
  const costosFiltrados = costosMantenimiento.filter(c => c.patente.toLowerCase().includes(busqueda.toLowerCase()));

  const totalMantenimientos = busesMantenimientos.reduce((sum, bus) => sum + (bus.total_mantenimientos || 0), 0);
  const totalCostos = costosMantenimiento.reduce((sum, bus) => sum + (bus.costo_total_mantenimiento || 0), 0);
  const busesActivables = busesEmergencia.filter(bus => bus.activable_emergencia).length;

  // --- RENDERS DE CONTENIDO MODAL ---

  // 1. Modal para Buses en Taller
  const renderModalBusesTaller = () => {
    const datos = Array.isArray(datosModal.datos) ? datosModal.datos : [];
    if (datos.length === 0) return <p className="text-center text-gray-500 py-6">No hay registros.</p>;
    
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Bus</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Problema</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Fecha Inicio</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Días</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datos.map((bus, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                   <p className="text-sm font-bold text-gray-900">{bus.patente}</p>
                   <p className="text-xs text-gray-500">{bus.marca} {bus.modelo}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                   <p className="truncate max-w-xs" title={bus.descripcion}>{bus.descripcion || 'Sin descripción'}</p>
                   <span className="text-xs text-gray-400">{bus.tipo_mantenimiento}</span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">{formatFecha(bus.fecha_inicio)}</td>
                <td className="px-6 py-4 text-center">
                   <span className={`px-2 py-1 rounded-full text-xs font-bold ${bus.dias_en_mantenimiento > 7 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                     {bus.dias_en_mantenimiento}d
                   </span>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className={`px-2 py-1 rounded-full text-xs font-bold ${bus.activable_emergencia ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                     {bus.activable_emergencia ? 'Activable' : 'No disponible'}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 2. Modal para Resumen de Mantenimientos
  const renderModalResumenMantenimientos = () => {
    const datos = Array.isArray(datosModal.datos) ? datosModal.datos : [];
    if (datos.length === 0) return <p className="text-center text-gray-500 py-6">No hay registros.</p>;

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Bus</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Total Mtos.</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Prev. / Corr.</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Costo Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datos.map((bus, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                   <p className="text-sm font-bold text-gray-900">{bus.patente}</p>
                   <p className="text-xs text-gray-500">{bus.marca} {bus.modelo}</p>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{bus.total_mantenimientos}</span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                   <span className="text-green-600 font-bold">{bus.preventivos}</span> / <span className="text-red-600 font-bold">{bus.correctivos}</span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-gray-800">
                   {formatCurrency(bus.costo_total_mantenimientos)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 3. Modal para Documentos (SOAP y Permisos)
  const renderModalDocumentos = () => {
    const datos = Array.isArray(datosModal.datos) ? datosModal.datos : [];
    if (datos.length === 0) return <p className="text-center text-gray-500 py-6">No hay documentos por vencer.</p>;

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Bus</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Documento</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Vencimiento</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datos.map((doc, idx) => {
              const dias = getDiasRestantes(doc.fecha_vencimiento);
              return (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                     <p className="text-sm font-bold text-gray-900">{doc.patente}</p>
                     <p className="text-xs text-gray-500">{doc.modelo}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                     {datosModal.tipo === 'soap' ? 'SOAP' : 'Rev. Técnica'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                     {formatFecha(doc.fecha_vencimiento)}
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={`px-2 py-1 rounded-full text-xs font-bold ${dias < 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                       {dias < 0 ? 'Vencido' : `${dias} días`}
                     </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // 4. Modal para Costos y Fallas (Genérico de Lista)
  const renderModalListaSimple = () => {
    const datos = Array.isArray(datosModal.datos) ? datosModal.datos : [];
    if (datos.length === 0) return <p className="text-center text-gray-500 py-6">No hay registros.</p>;

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Concepto</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Cantidad</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Monto / Detalle</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datos.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {item.patente || item.tipo_falla || 'Item'}
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  {item.cantidad || item.total_mantenimientos || 0}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-gray-800">
                  {item.costo_maximo ? formatCurrency(item.costo_maximo) : 
                   item.costo_total_mantenimiento ? formatCurrency(item.costo_total_mantenimiento) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderModalContent = () => {
    if (datosModal.tipo === 'taller') return renderModalBusesTaller();
    if (datosModal.tipo === 'mantenimientos') return renderModalResumenMantenimientos();
    if (datosModal.tipo === 'soap' || datosModal.tipo === 'permiso') return renderModalDocumentos();
    if (datosModal.tipo === 'fallas' || datosModal.tipo === 'costos') return renderModalListaSimple();
    
    // Fallback JSON
    return (
      <div className="bg-gray-50 p-4 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96 border border-gray-200">
        {JSON.stringify(datosModal.datos, null, 2)}
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando dashboard...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-900">
      
      {/* HEADER HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Análisis de Mantenimiento</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Gestión integral de flota, costos y reparaciones.</p>
          </div>
          <button 
             onClick={handleDescargarAnalisisMantenimientos}
             disabled={descargandoPdf}
             className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {descargandoPdf ? <RefreshCw className="animate-spin" size={20} /> : <FileText size={20} />}
            {descargandoPdf ? 'Generando...' : 'Descargar Reporte'}
          </button>
        </div>
        <Wrench className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-40">
             <select 
               value={mes} 
               onChange={(e) => setMes(Number(e.target.value))} 
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm appearance-none bg-white cursor-pointer"
             >
               {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{getMesNombre(i+1)}</option>)}
             </select>
             <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
             <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
          <div className="relative w-full md:w-32">
             <select 
               value={anio} 
               onChange={(e) => setAnio(Number(e.target.value))} 
               className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm appearance-none bg-white cursor-pointer"
             >
               {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
             </select>
             <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por patente, modelo o tipo de falla..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>

        <button 
          onClick={loadData}
          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-gray-200"
          title="Actualizar datos"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* METRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Mantenimientos"
          value={totalMantenimientos}
          icon={Wrench}
          color="orange"
          interactive
          subtitle="Ver detalles"
          onClick={() => abrirModalConDatos('Detalle Mantenimientos', busesMantenimientos, 'mantenimientos')}
        />
        <MetricCard
          title="Flota en Taller"
          value={busesEmergencia.length}
          icon={AlertTriangle}
          color="red"
          interactive
          subtitle="Ver listado"
          onClick={() => abrirModalConDatos('Buses en Taller', busesEmergencia, 'taller')}
        />
        <MetricCard title="Costo Mensual" value={formatCurrency(totalCostos)} icon={DollarSign} color="blue" />
        <MetricCard title="Activables Emergencia" value={busesActivables} icon={Power} color="green" subtitle="Ver disponibles" />
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-6 space-x-1 overflow-x-auto">
        {[
          { id: 'general', label: 'Resumen General', icon: BarChart3 },
          { id: 'taller', label: 'Flota en Taller', icon: Power },
          { id: 'costos', label: 'Costos y Fallas', icon: DollarSign },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tabActiva === tab.id 
                ? 'border-orange-600 text-orange-700 bg-orange-50/30' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO TABS */}
      
      {tabActiva === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <PieChartIcon size={20} className="text-gray-400"/> Distribución de Alertas
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={[
                      { name: 'Aceite', value: alertasData.por_tipo?.cambio_aceite || 0 },
                      { name: 'Técnica', value: alertasData.por_tipo?.revision_tecnica || 0 },
                      { name: 'Mant.', value: alertasData.por_tipo?.mantenimiento || 0 }
                    ]} cx="50%" cy="50%" innerRadius={70} outerRadius={90} dataKey="value"
                  >
                    <Cell fill="#f59e0b" /><Cell fill="#3b82f6" /><Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom"/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-gray-400"/> Modelos con más Fallas
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topsData.top_modelos_fallas.slice(0, 5)} layout="vertical" margin={{left: 20}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="marca_modelo" type="category" width={100} tick={{fontSize: 11}} />
                  <Tooltip />
                  <Bar dataKey="total_fallas" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={24} name="Fallas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'taller' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 animate-in fade-in duration-300">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">Vehículos en Mantenimiento</h3>
            <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">Total: {busesEmergenciaFiltrados.length}</span>
          </div>
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Bus</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Diagnóstico</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Ingreso</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Tiempo</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {busesEmergenciaFiltrados.length === 0 ? (
                 <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No hay vehículos en taller</td></tr>
              ) : (
                busesEmergenciaFiltrados.map((bus) => (
                  <tr key={bus.bus_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{bus.patente}</p>
                      <p className="text-xs text-gray-500">{bus.modelo}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 truncate max-w-xs" title={bus.descripcion}>{bus.descripcion}</p>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{bus.tipo_mantenimiento}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">{formatFecha(bus.fecha_inicio)}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${bus.dias_en_mantenimiento > 7 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {bus.dias_en_mantenimiento} días
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {bus.activable_emergencia ? (
                        <button 
                          onClick={() => handleActivarBusEmergencia(bus.bus_id, bus.patente)}
                          disabled={activandoBus === bus.bus_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors font-medium"
                        >
                          <Power size={14}/> {activandoBus === bus.bus_id ? '...' : 'Activar'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No disponible</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tabActiva === 'costos' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in duration-300">
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
               <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">Fallas Frecuentes</h3>
            </div>
            <table className="w-full">
               <thead className="bg-gray-100 border-b border-gray-200">
                 <tr>
                   <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Tipo Falla</th>
                   <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Cant.</th>
                   <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Costo Máx</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {tiposFallasFiltrados.slice(0, 8).map((falla, i) => (
                   <tr key={i} className="hover:bg-gray-50">
                     <td className="px-6 py-4 text-sm font-medium text-gray-900">{falla.tipo_falla}</td>
                     <td className="px-6 py-4 text-center">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">{falla.cantidad}</span>
                     </td>
                     <td className="px-6 py-4 text-right text-sm font-medium text-red-600">{formatCurrency(falla.costo_maximo)}</td>
                   </tr>
                 ))}
               </tbody>
            </table>
            {tiposFallasFiltrados.length > 8 && (
               <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                  <button onClick={() => abrirModalConDatos('Todas las Fallas', tiposFallas, 'fallas')} className="text-sm font-medium text-orange-600 hover:text-orange-800">Ver todas</button>
               </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
               <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">Costos por Unidad</h3>
            </div>
            <table className="w-full">
               <thead className="bg-gray-100 border-b border-gray-200">
                 <tr>
                   <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Bus</th>
                   <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Eventos</th>
                   <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Gasto Total</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {costosFiltrados.slice(0, 8).map((bus, i) => (
                   <tr key={i} className="hover:bg-gray-50">
                     <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{bus.patente}</p>
                        <p className="text-xs text-gray-500">{bus.modelo}</p>
                     </td>
                     <td className="px-6 py-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{bus.total_mantenimientos}</span>
                     </td>
                     <td className="px-6 py-4 text-right text-sm font-bold text-gray-800">{formatCurrency(bus.costo_total_mantenimiento)}</td>
                   </tr>
                 ))}
               </tbody>
            </table>
             {costosFiltrados.length > 8 && (
               <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                  <button onClick={() => abrirModalConDatos('Costos por Bus', costosMantenimiento, 'costos')} className="text-sm font-medium text-orange-600 hover:text-orange-800">Ver todas</button>
               </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER HISTORIAL REPORTES */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mt-8">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setMostrarHistorial(!mostrarHistorial)}>
          <div>
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              Historial de Reportes Generados
            </h4>
          </div>
          <button className="text-gray-400 hover:text-orange-600 transition-colors">
            <ChevronDown size={20} className={`transform transition-transform ${mostrarHistorial ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {mostrarHistorial && (
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
             {historialReportes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center">No hay historial disponible.</p>
             ) : (
               historialReportes.map(entry => (
                 <div key={entry.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-full border border-gray-200 text-orange-600">
                        <FileText size={14} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{entry.archivo}</p>
                        <p className="text-xs text-gray-500">
                           {formatHistorialMes(entry)} · {formatHistorialUsuario(entry)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold uppercase text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{entry.tipo}</span>
                 </div>
               ))
             )}
          </div>
        )}
      </div>

      {/* MODAL UNIVERSAL */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800">{datosModal.titulo}</h3>
              <button onClick={() => setModalAbierto(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20}/>
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/30">
              {renderModalContent()}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}