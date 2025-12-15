import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, FileText, Calendar, RefreshCw, 
  X, TrendingDown, UserMinus, ArrowRight, Search, ChevronDown, Filter 
} from 'lucide-react';
import {
  fetchAlertasContratos,
  fetchEmpleadosPorContrato,
  fetchRankingLicencias,
  fetchRankingLicenciasPdf,
  fetchResumenContratos,
  fetchEmpleadosAltoRiesgo,
  fetchEvolucionLicencias,
  updateEmpleado,
  fetchHistorialReportes
} from '../services/api';
import { 
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import MetricCard from '../components/cards/MetricCard';
import { useNotifications } from '../context/NotificationContext';

// Utilidades de formato
const formatFecha = (f) => f ? f.split('T')[0].split('-').reverse().join('-') : 'N/A';
const getMesNombre = (m) => ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][m - 1];
const formatHistorialFecha = (value) => value ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-';
const formatHistorialMes = (entry) => (entry?.mes && entry?.anio) ? `${getMesNombre(Number(entry.mes))} ${entry.anio}` : 'Mes desconocido';
const formatHistorialUsuario = (entry) => {
  const nombre = entry?.user?.nombre;
  const apellido = entry?.user?.apellido;
  if (nombre || apellido) return `${nombre ?? ''} ${apellido ?? ''}`.trim();
  return entry.user_id ? `Usuario ${entry.user_id}` : 'Sistema';
};

export default function AnalisisRRHHPage() {
  // --- ESTADOS ---
  const [alertasContratos, setAlertasContratos] = useState([]);
  const [rankingLicencias, setRankingLicencias] = useState([]);
  const [resumenContratos, setResumenContratos] = useState({});
  const [empleadosAltoRiesgo, setEmpleadosAltoRiesgo] = useState([]);
  const [evolucionLicencias, setEvolucionLicencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesandoBaja, setProcesandoBaja] = useState(null);
  const [descargandoRanking, setDescargandoRanking] = useState(false);
  const [historialReportes, setHistorialReportes] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  
  // Detalle Contratos (Dropdown)
  const [detalleContratos, setDetalleContratos] = useState({
    abierto: false,
    tipo: null,
    titulo: '',
    registros: [],
    cargando: false,
  });

  // Filtros
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [busqueda, setBusqueda] = useState('');

  // UI
  const [tabActiva, setTabActiva] = useState('resumen'); 
  const [modalAbierto, setModalAbierto] = useState(false);
  const [datosModal, setDatosModal] = useState({ titulo: '', datos: [], tipo: null });

  const { addNotification } = useNotifications();

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

  // --- CARGA DE DATOS ---
  useEffect(() => {
    loadData();
  }, [mes, anio]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = getFiltroParams();
      const historialPromise = fetchHistorialReportes({ tipo: 'rrhh', mes, anio });

      const [alertas, ranking, resumen, altoRiesgo] = await Promise.all([
        fetchAlertasContratos(params),
        fetchRankingLicencias(params),
        fetchResumenContratos(params),
        fetchEmpleadosAltoRiesgo(params)
      ]);

      setAlertasContratos(alertas.data || []);
      setRankingLicencias(ranking.data || []);
      setResumenContratos(resumen.data || {});
      setEmpleadosAltoRiesgo(altoRiesgo.data || []);

      try {
        const evolucion = await fetchEvolucionLicencias({ meses: 12 });
        setEvolucionLicencias(evolucion.data || []);
      } catch (e) { console.warn("Error Evolución", e); setEvolucionLicencias([]); }

      const historial = await historialPromise;
      setHistorialReportes(historial.data || []);

      if (detalleContratos.abierto && detalleContratos.tipo) {
         handleMostrarDetalleContrato(detalleContratos.tipo, detalleContratos.titulo, true);
      }

    } catch (error) {
      console.error(error);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de RRHH.');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarRankingLicencias = async () => {
    try {
      setDescargandoRanking(true);
      const params = getFiltroParams();
      const blob = await fetchRankingLicenciasPdf(params);
      const nombreArchivo = `ranking-licencias-${new Date().toISOString().slice(0, 10)}.pdf`;
      descargarBlob(blob, nombreArchivo);
      addNotification('success', 'Reporte generado', 'Se descargó el ranking de licencias.');
    } catch (error) {
      console.error(error);
      addNotification('error', 'Error', 'No se pudo descargar el PDF de licencias.');
    } finally {
      setDescargandoRanking(false);
    }
  };

  const handleMostrarDetalleContrato = async (tipo, titulo, isRefresh = false) => {
    if (!isRefresh && detalleContratos.abierto && detalleContratos.tipo === tipo) {
      setDetalleContratos(prev => ({ ...prev, abierto: false }));
      return;
    }

    setDetalleContratos({
      abierto: true,
      tipo,
      titulo,
      registros: isRefresh ? detalleContratos.registros : [],
      cargando: true,
    });

    try {
      const respuesta = await fetchEmpleadosPorContrato({ tipo });
      setDetalleContratos(prev => ({
        ...prev,
        registros: respuesta.data || [],
        cargando: false,
      }));
    } catch (error) {
      console.error(error);
      addNotification('error', 'Error', 'No se pudo cargar los empleados.');
      setDetalleContratos(prev => ({ ...prev, cargando: false }));
    }
  };

  const cerrarDetalleContratos = () => {
    setDetalleContratos(prev => ({ ...prev, abierto: false }));
  };

  const handleDarDeBaja = async (empleadoId, nombreCompleto) => {
    if (!window.confirm(`¿Está seguro de dar de baja a ${nombreCompleto}?`)) return;
    try {
      setProcesandoBaja(empleadoId);
      await updateEmpleado(empleadoId, { estado: 'terminado' });
      addNotification('success', 'Baja Exitosa', `${nombreCompleto} ha sido dado de baja.`);
      loadData();
    } catch (error) {
      addNotification('error', 'Error', 'No se pudo dar de baja al empleado.');
    } finally {
      setProcesandoBaja(null);
    }
  };

  // --- HELPERS Y RENDERIZADO MODAL ---
  const abrirModalConDatos = (titulo, datos, tipo = null) => {
    setDatosModal({ titulo, datos, tipo });
    setModalAbierto(true);
  };

  // Render para Ranking (Estilo Tabla Empleados)
  const renderModalRanking = () => {
    const datos = Array.isArray(datosModal.datos) ? datosModal.datos : [];
    if (datos.length === 0) return <p className="text-center text-gray-500 py-6">No hay registros.</p>;

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider w-16">#</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Colaborador</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Licencias</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Días Totales</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 uppercase tracking-wider">Promedio</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datos.map((emp, idx) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-center text-sm font-bold text-gray-400">{idx + 1}</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">{emp.nombre_completo}</p>
                  <p className="text-xs text-gray-500">{emp.tipo_contrato} · {emp.numero_empleado}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-bold">{emp.total_licencias}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs font-bold">{emp.total_dias_licencia} días</span>
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-600">
                   {Math.round(emp.total_dias_licencia / (emp.total_licencias || 1))} días/lic
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render para Riesgo/Vencimientos (Estilo Tabla Empleados)
  const renderModalRiesgo = () => {
    const datos = Array.isArray(datosModal.datos) ? datosModal.datos : [];
    if (datos.length === 0) return <p className="text-center text-gray-500 py-6">No hay alertas.</p>;

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Colaborador</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Detalle Riesgo</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Días Restantes</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datos.map((emp) => (
              <tr key={emp.id} className="hover:bg-red-50/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-900">{emp.nombre_completo}</p>
                  <p className="text-xs text-gray-500">{emp.numero_empleado}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="block">{emp.total_licencias} licencias en periodo prueba</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">{emp.dias_restantes} días</span>
                </td>
                <td className="px-6 py-4 text-center">
                   <button 
                      onClick={() => handleDarDeBaja(emp.id, emp.nombre_completo)}
                      disabled={procesandoBaja === emp.id}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded text-xs font-bold transition-colors"
                   >
                      {procesandoBaja === emp.id ? '...' : 'No Renovar'}
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderModalContent = () => {
    if (datosModal.tipo === 'ranking') return renderModalRanking();
    if (datosModal.tipo === 'riesgo') return renderModalRiesgo();
    
    // Fallback JSON bonito
    return (
      <div className="bg-gray-50 p-4 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96 border border-gray-200">
        {JSON.stringify(datosModal.datos, null, 2)}
      </div>
    );
  };

  const rankingFiltrado = rankingLicencias.filter(emp =>
    emp.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    emp.numero_empleado?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const alertasFiltradas = alertasContratos.filter(emp => 
    emp.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    emp.apellido?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando dashboard RRHH...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      
      {/* HEADER HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Capital Humano</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Indicadores clave de gestión, ausentismo y contratos.</p>
          </div>
          <button
            onClick={handleDescargarRankingLicencias}
            disabled={descargandoRanking}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {descargandoRanking ? <RefreshCw className="animate-spin" size={20} /> : <FileText size={20} />}
            {descargandoRanking ? 'Generando...' : 'Descargar Reporte'}
          </button>
        </div>
        <Users className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-40">
             <select 
               value={mes} 
               onChange={(e) => setMes(Number(e.target.value))} 
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white cursor-pointer"
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
               className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white cursor-pointer"
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
            placeholder="Buscar por nombre o número de empleado..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <button onClick={loadData} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200" title="Actualizar datos">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex border-b border-gray-200 mb-6 space-x-1 overflow-x-auto">
        {[
          { id: 'resumen', label: 'Resumen General', icon: Users },
          { id: 'licencias', label: 'Ausentismo y Licencias', icon: TrendingDown },
          { id: 'riesgo', label: 'Riesgo y Contratos', icon: AlertTriangle },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tabActiva === tab.id 
                ? 'border-blue-600 text-blue-700 bg-blue-50/30' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- CONTENIDO TABS --- */}
      
      {/* 1. RESUMEN */}
      {tabActiva === 'resumen' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Activos"
              value={resumenContratos.total_activos}
              icon={Users}
              color="blue"
              interactive
              subtitle="Ver lista completa"
              onClick={() => handleMostrarDetalleContrato('activo', 'Empleados Activos')}
            />
            <MetricCard
              title="Plazo Fijo"
              value={resumenContratos.plazo_fijo}
              icon={FileText}
              color="orange"
              interactive
              subtitle="Contratos temporales"
              onClick={() => handleMostrarDetalleContrato('plazo_fijo', 'Personal Plazo Fijo')}
            />
            <MetricCard
              title="Indefinidos"
              value={resumenContratos.indefinido}
              icon={Users}
              color="green"
              interactive
              subtitle="Contratos permanentes"
              onClick={() => handleMostrarDetalleContrato('indefinido', 'Personal Indefinido')}
            />
            <MetricCard
              title="Vencen Mes"
              value={resumenContratos.vencen_proximo_mes}
              icon={AlertTriangle}
              color="red"
              subtitle="Renovación urgente"
            />
          </div>

          {/* DETALLE CONTRATOS (DROPDOWN) - AHORA CON SCROLL */}
          {detalleContratos.abierto && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{detalleContratos.titulo}</h3>
                  <p className="text-sm text-gray-500">
                    {detalleContratos.cargando ? 'Cargando datos...' : `${detalleContratos.registros.length} registros encontrados`}
                  </p>
                </div>
                <button onClick={cerrarDetalleContratos} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                  <X size={20} />
                </button>
              </div>

              {/* AQUÍ ESTÁ EL CAMBIO PRINCIPAL: max-h-96 y overflow-y-auto */}
              <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar border rounded-lg">
                  {detalleContratos.cargando ? (
                    <div className="py-8 text-center text-gray-400">
                        <RefreshCw className="animate-spin inline-block mr-2" /> Cargando...
                    </div>
                  ) : detalleContratos.registros.length === 0 ? (
                    <p className="text-center py-6 text-gray-500">No hay empleados en esta categoría.</p>
                  ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 font-semibold uppercase tracking-wider sticky top-0 z-10">
                          <tr>
                              <th className="px-6 py-3">Empleado</th>
                              <th className="px-6 py-3">Contrato</th>
                              <th className="px-6 py-3">Ubicación</th>
                              <th className="px-6 py-3 text-right">Término</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {detalleContratos.registros.map(emp => (
                              <tr key={`${emp.id}-${emp.numero_empleado}`} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3">
                                    <p className="font-bold text-gray-900">{emp.nombre_completo}</p>
                                    <p className="text-xs text-gray-500">{emp.numero_empleado}</p>
                                </td>
                                <td className="px-6 py-3 text-gray-700 capitalize">{emp.tipo_contrato?.replace('_', ' ')}</td>
                                <td className="px-6 py-3 text-gray-600">{emp.ciudad || '-'}</td>
                                <td className="px-6 py-3 text-right text-gray-600">
                                    {emp.fecha_termino ? formatFecha(emp.fecha_termino) : <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded">Indefinido</span>}
                                </td>
                              </tr>
                          ))}
                        </tbody>
                    </table>
                  )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                Distribución de Contratos
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Indefinido', value: resumenContratos.indefinido },
                        { name: 'Plazo Fijo', value: resumenContratos.plazo_fijo },
                        { name: 'Practicante', value: resumenContratos.practicante }
                      ]} 
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                    >
                      <Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-red-500 rounded-full"></span>
                Evolución de Ausentismo (12 Meses)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucionLicencias} margin={{ left: 0, right: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="mes" tick={{fontSize:11, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="total_licencias" stroke="#3b82f6" dot={{r: 4}} strokeWidth={3} name="N° Licencias" />
                    <Line yAxisId="right" type="monotone" dataKey="total_dias" stroke="#ef4444" dot={{r: 4}} strokeWidth={3} name="Días Perdidos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LICENCIAS */}
      {tabActiva === 'licencias' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide flex items-center gap-2">
                <TrendingDown className="text-red-500" size={18} /> Ranking de Ausentismo
              </h3>
            </div>
            
            <div className="overflow-x-auto flex-grow">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 w-16 text-center">#</th>
                        <th className="px-6 py-3">Colaborador</th>
                        <th className="px-6 py-3 text-center">Eventos</th>
                        <th className="px-6 py-3 text-center">Días Totales</th>
                        <th className="px-6 py-3 text-right">Promedio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rankingFiltrado.slice(0, 8).map((emp, idx) => (
                        <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 text-center font-bold text-gray-400">{idx + 1}</td>
                          <td className="px-6 py-3">
                              <p className="font-bold text-gray-900">{emp.nombre_completo}</p>
                              <p className="text-xs text-gray-500">{emp.tipo_contrato} · {emp.numero_empleado}</p>
                          </td>
                          <td className="px-6 py-3 text-center">
                              <span className="bg-gray-100 px-2.5 py-1 rounded-full text-xs font-bold text-gray-700">{emp.total_licencias}</span>
                          </td>
                          <td className="px-6 py-3 text-center">
                              <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">{emp.total_dias_licencia} días</span>
                          </td>
                          <td className="px-6 py-3 text-right text-gray-500 font-medium">
                              {Math.round(emp.total_dias_licencia / (emp.total_licencias || 1))} días/lic
                          </td>
                        </tr>
                    ))}
                    {rankingFiltrado.length === 0 && (
                        <tr><td colSpan="5" className="text-center py-8 text-gray-400">Sin datos de licencias</td></tr>
                    )}
                  </tbody>
                </table>
            </div>
            {rankingLicencias.length > 8 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                  <button onClick={() => abrirModalConDatos('Ranking Completo', rankingLicencias, 'ranking')} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    Ver listado completo
                  </button>
                </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 h-fit">
            <h3 className="font-bold text-gray-800 mb-6 text-center uppercase text-sm tracking-wide">Motivos Principales</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={[
                      { name: 'Lic. Médicas', value: rankingLicencias.reduce((s, e) => s + (e.licencias_medicas||0), 0) },
                      { name: 'Administrativas', value: rankingLicencias.reduce((s, e) => s + (e.licencias_administrativas||0), 0) },
                      { name: 'Permisos', value: rankingLicencias.reduce((s, e) => s + (e.permisos||0), 0) }
                    ]} 
                    cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value"
                  >
                    <Cell fill="#ef4444" /><Cell fill="#3b82f6" /><Cell fill="#10b981" />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom"/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center text-sm border border-gray-200">
                <span className="text-gray-600 font-medium">Total Días Perdidos</span>
                <span className="font-bold text-gray-900 text-lg">{rankingLicencias.reduce((s, e) => s + (e.total_dias_licencia||0), 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. RIESGO */}
      {tabActiva === 'riesgo' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-300">
          
          {/* Alertas Alto Riesgo */}
          <div className="bg-white rounded-lg shadow-md border border-red-200 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50/30 flex justify-between items-center">
              <h3 className="font-bold text-red-800 uppercase text-sm tracking-wide flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600" /> Riesgo de No Renovación
              </h3>
              <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">{empleadosAltoRiesgo.length}</span>
            </div>
            
            <div className="overflow-x-auto flex-grow p-6">
              <div className="space-y-4">
                  {empleadosAltoRiesgo.length === 0 ? (
                    <p className="text-gray-400 text-center py-10 italic">No hay alertas de alto riesgo.</p>
                  ) : (
                    empleadosAltoRiesgo.slice(0, 5).map(emp => (
                        <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-red-50 border border-red-100 gap-4 hover:shadow-sm transition-shadow">
                          <div>
                              <p className="font-bold text-gray-900">{emp.nombre_completo}</p>
                              <div className="flex items-center gap-2 text-xs mt-1">
                                <span className="text-red-700 font-semibold bg-white px-2 py-0.5 rounded border border-red-200 shadow-sm">
                                    Vence en {emp.dias_restantes} días
                                </span>
                                <span className="text-gray-600">{emp.total_licencias} licencias en periodo prueba</span>
                              </div>
                          </div>
                          <button 
                              onClick={() => handleDarDeBaja(emp.id, emp.nombre_completo)}
                              disabled={procesandoBaja === emp.id}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm uppercase tracking-wide"
                          >
                              <UserMinus size={14} /> 
                              {procesandoBaja === emp.id ? '...' : 'No Renovar'}
                          </button>
                        </div>
                    ))
                  )}
              </div>
            </div>
            {empleadosAltoRiesgo.length > 5 && (
                <div className="p-3 border-t border-red-100 bg-red-50 text-center">
                  <button onClick={() => abrirModalConDatos('Alto Riesgo', empleadosAltoRiesgo, 'riesgo')} className="text-sm font-bold text-red-700 hover:text-red-900 transition-colors">
                    Ver todas las alertas
                  </button>
                </div>
            )}
          </div>

          {/* VENCIMIENTOS PRÓXIMOS - AHORA CON SCROLL COMPLETO */}
          <div className="bg-white rounded-lg shadow-md border border-yellow-200 overflow-hidden flex flex-col h-[500px]">
            <div className="px-6 py-4 border-b border-yellow-100 bg-yellow-50/30 flex justify-between items-center">
              <h3 className="font-bold text-yellow-800 uppercase text-sm tracking-wide flex items-center gap-2">
                <Calendar size={18} className="text-yellow-600"/> Próximos Vencimientos
              </h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">{alertasFiltradas.length}</span>
            </div>

            {/* APLICADO SCROLL AQUÍ Y REMOVIDO SLICE EN LA ITERACIÓN */}
            <div className="overflow-x-auto flex-grow overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="bg-yellow-50/50 text-gray-600 font-semibold uppercase tracking-wider border-b border-yellow-100 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3">Empleado</th>
                        <th className="px-6 py-3 text-center">Fecha Término</th>
                        <th className="px-6 py-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alertasFiltradas.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-10 text-gray-400 italic">No hay vencimientos próximos</td></tr>
                    ) : (
                        // SE MOSTRARÁN TODOS CON SCROLL
                        alertasFiltradas.map(emp => (
                          <tr key={emp.id} className="hover:bg-yellow-50/30 transition-colors">
                              <td className="px-6 py-3 font-medium text-gray-900">
                                {emp.nombre} {emp.apellido}
                              </td>
                              <td className="px-6 py-3 text-center text-gray-600">
                                {formatFecha(emp.fecha_termino)}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                    emp.dias_restantes < 7 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {emp.dias_restantes} días
                                </span>
                              </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER: HISTORIAL */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 mt-8">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setMostrarHistorial(!mostrarHistorial)}>
          <div>
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              Historial de Reportes Generados
            </h4>
          </div>
          <button className="text-gray-400 hover:text-blue-600 transition-colors">
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
                    <div className="bg-white p-2 rounded-full border border-gray-200 text-blue-600">
                      <FileText size={14} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{entry.archivo || 'Reporte RRHH'}</p>
                      <p className="text-xs text-gray-500">
                          {formatHistorialMes(entry)} · {formatHistorialUsuario(entry)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold uppercase text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                    {entry.tipo}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* --- MODAL GLOBAL --- */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
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