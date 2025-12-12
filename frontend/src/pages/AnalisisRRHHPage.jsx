import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, FileText, Calendar, RefreshCw, X, TrendingDown, UserMinus, ArrowRight } from 'lucide-react';
import {
  fetchAlertasContratos,
  fetchRankingLicencias,
  fetchResumenContratos,
  fetchEmpleadosAltoRiesgo,
  fetchEvolucionLicencias,
  updateEmpleado
} from '../services/api';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MetricCard from '../components/cards/MetricCard';
import { useNotifications } from '../context/NotificationContext';

export default function AnalisisRRHHPage() {
  // --- ESTADOS ---
  const [alertasContratos, setAlertasContratos] = useState([]);
  const [rankingLicencias, setRankingLicencias] = useState([]);
  const [resumenContratos, setResumenContratos] = useState({});
  const [empleadosAltoRiesgo, setEmpleadosAltoRiesgo] = useState([]);
  const [evolucionLicencias, setEvolucionLicencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesandoBaja, setProcesandoBaja] = useState(null);

  // Filtros
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [filtroActivo, setFiltroActivo] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // UI
  const [tabActiva, setTabActiva] = useState('resumen'); // resumen, licencias, riesgo
  const [modalAbierto, setModalAbierto] = useState(false);
  const [datosModal, setDatosModal] = useState({ titulo: '', datos: [] });

  const { addNotification } = useNotifications();

  // --- CARGA DE DATOS ---
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

    } catch (error) {
      console.error(error);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de RRHH.');
    } finally {
      setLoading(false);
    }
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

  // --- HELPERS ---
  const abrirModalConDatos = (titulo, datos) => {
    setDatosModal({ titulo, datos });
    setModalAbierto(true);
  };

  const getMesNombre = (m) => ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][m - 1];
  const formatFecha = (f) => f ? f.split('T')[0].split('-').reverse().join('-') : 'N/A';
  const getTipoContratoColor = (t) => ({ 'indefinido': 'bg-green-100 text-green-800', 'plazo_fijo': 'bg-yellow-100 text-yellow-800', 'practicante': 'bg-blue-100 text-blue-800' }[t] || 'bg-gray-100');

  // Filtrado
  const rankingFiltrado = rankingLicencias.filter(emp =>
    emp.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    emp.numero_empleado?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando RRHH...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* HEADER COMPACTO */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Users className="text-blue-600" /> Capital Humano
          </h1>
          <p className="text-xs text-gray-500">Indicadores de RRHH y Gestión</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 select-none cursor-pointer">
            <input type="checkbox" checked={filtroActivo} onChange={(e) => setFiltroActivo(e.target.checked)} className="text-blue-600 rounded" />
            <span className="text-sm font-medium">Filtrar Fecha</span>
          </label>

          {filtroActivo && (
            <div className="flex gap-2">
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="text-sm border-gray-300 rounded-lg py-1.5 focus:ring-blue-500">
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{getMesNombre(i+1)}</option>)}
              </select>
              <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="text-sm border-gray-300 rounded-lg py-1.5 focus:ring-blue-500">
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          <input 
            type="text" 
            placeholder="Buscar..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
            className="text-sm border border-gray-300 rounded-lg py-1.5 px-3 w-40 focus:ring-blue-500"
          />
          
          <button onClick={loadData} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* PESTAÑAS */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-lg px-2 overflow-x-auto">
        {[
          { id: 'resumen', label: 'Resumen General' },
          { id: 'licencias', label: 'Ausentismo y Licencias' },
          { id: 'riesgo', label: 'Riesgo y Contratos' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tabActiva === tab.id ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- PESTAÑA 1: RESUMEN --- */}
      {tabActiva === 'resumen' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Total Activos" value={resumenContratos.total_activos} icon={Users} color="blue" />
            <MetricCard title="Plazo Fijo" value={resumenContratos.plazo_fijo} icon={FileText} color="orange" />
            <MetricCard title="Indefinidos" value={resumenContratos.indefinido} icon={Users} color="green" />
            <MetricCard title="Vencen Mes" value={resumenContratos.vencen_proximo_mes} icon={AlertTriangle} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4 text-center">Distribución Contratos</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: 'Indefinido', value: resumenContratos.indefinido },
                      { name: 'Plazo Fijo', value: resumenContratos.plazo_fijo },
                      { name: 'Practicante', value: resumenContratos.practicante }
                    ]} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                      <Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Tendencia de Licencias (12 meses)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucionLicencias}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" tick={{fontSize:10}} />
                    <YAxis yAxisId="left" fontSize={10} />
                    <YAxis yAxisId="right" orientation="right" fontSize={10} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="total_licencias" stroke="#3b82f6" dot={false} strokeWidth={2} name="N° Licencias" />
                    <Line yAxisId="right" type="monotone" dataKey="total_dias" stroke="#ef4444" dot={false} strokeWidth={2} name="Días Totales" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PESTAÑA 2: LICENCIAS (Top 5 + Ver más) --- */}
      {tabActiva === 'licencias' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <TrendingDown className="text-orange-500" /> Ranking Ausentismo
              </h3>
              <button onClick={() => abrirModalConDatos('Ranking Completo', rankingLicencias)} className="text-xs text-blue-600 font-bold hover:underline bg-blue-50 px-3 py-1 rounded">
                Ver todos
              </button>
            </div>
            <div className="space-y-4">
              {rankingFiltrado.slice(0, 5).map((emp, idx) => (
                <div key={emp.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-bold text-gray-500 text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{emp.nombre_completo}</p>
                    <p className="text-xs text-gray-500">{emp.tipo_contrato} • {emp.numero_empleado}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-bold text-orange-600">{emp.total_dias_licencia}d</span>
                    <span className="text-xs text-gray-400">{emp.total_licencias} lic.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
            <h3 className="font-bold text-gray-800 mb-4 text-center">Motivos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { name: 'Médicas', value: rankingLicencias.reduce((s, e) => s + (e.licencias_medicas||0), 0) },
                    { name: 'Admin.', value: rankingLicencias.reduce((s, e) => s + (e.licencias_administrativas||0), 0) },
                    { name: 'Permisos', value: rankingLicencias.reduce((s, e) => s + (e.permisos||0), 0) }
                  ]} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value">
                    <Cell fill="#ef4444" /><Cell fill="#3b82f6" /><Cell fill="#10b981" />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom"/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- PESTAÑA 3: RIESGO (Top 5 + Ver más) --- */}
      {tabActiva === 'riesgo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          
          {/* Alertas Alto Riesgo */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
            <div className="flex justify-between items-center mb-4 border-b border-red-100 pb-2">
              <h3 className="font-bold text-red-700 flex items-center gap-2"><AlertTriangle size={20}/> Riesgo No Renovación</h3>
              <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{empleadosAltoRiesgo.length}</span>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {empleadosAltoRiesgo.length === 0 ? <p className="text-gray-400 text-center py-10">Sin alertas</p> : 
                empleadosAltoRiesgo.slice(0, 5).map(emp => (
                  <div key={emp.id} className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <div className="flex justify-between mb-2">
                      <p className="font-bold text-gray-800 text-sm">{emp.nombre_completo}</p>
                      <p className="text-xs font-bold text-red-600">Vence: {emp.dias_restantes} días</p>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{emp.total_licencias} licencias en periodo prueba.</p>
                    <button 
                      onClick={() => handleDarDeBaja(emp.id, emp.nombre_completo)}
                      disabled={procesandoBaja === emp.id}
                      className="w-full py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-100 text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                    >
                      <UserMinus size={14} /> {procesandoBaja === emp.id ? '...' : 'No Renovar'}
                    </button>
                  </div>
                ))
              }
              {empleadosAltoRiesgo.length > 5 && (
                <button onClick={() => abrirModalConDatos('Alto Riesgo', empleadosAltoRiesgo)} className="w-full text-center text-xs text-red-600 font-bold py-2 hover:underline">Ver todos</button>
              )}
            </div>
          </div>

          {/* Vencimientos Próximos */}
          <div className="bg-white rounded-xl shadow-sm border border-yellow-100 p-6">
            <div className="flex justify-between items-center mb-4 border-b border-yellow-100 pb-2">
              <h3 className="font-bold text-yellow-700 flex items-center gap-2"><Calendar size={20}/> Vencimientos Próximos</h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">{alertasContratos.length}</span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alertasContratos.length === 0 ? <p className="text-gray-400 text-center py-10">Sin vencimientos</p> :
                alertasContratos.slice(0, 10).map(emp => (
                  <div key={emp.id} className="flex justify-between items-center p-3 bg-yellow-50/50 rounded hover:bg-yellow-50">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{emp.nombre} {emp.apellido}</p>
                      <p className="text-xs text-gray-500">{formatFecha(emp.fecha_termino)}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${emp.dias_restantes < 7 ? 'text-red-600 bg-red-50' : 'text-yellow-700 bg-yellow-100'}`}>
                      {emp.dias_restantes} días
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DETALLES --- */}
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