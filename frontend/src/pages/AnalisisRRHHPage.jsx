import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, FileText, Ban, Calendar, RefreshCw, ChevronDown, ChevronUp, X, TrendingDown } from 'lucide-react';
import {
  fetchAlertasContratos,
  fetchRankingLicencias,
  fetchResumenContratos,
  fetchEmpleadosAltoRiesgo,
  fetchEvolucionLicencias,
  updateEmpleado
} from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import MetricCard from '../components/cards/MetricCard';
import { useNotifications } from '../context/NotificationContext';

export default function AnalisisRRHHPage() {
  const [alertasContratos, setAlertasContratos] = useState([]);
  const [rankingLicencias, setRankingLicencias] = useState([]);
  const [resumenContratos, setResumenContratos] = useState({});
  const [empleadosAltoRiesgo, setEmpleadosAltoRiesgo] = useState([]);
  const [evolucionLicencias, setEvolucionLicencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesandoBaja, setProcesandoBaja] = useState(null);

  // Filtros simples
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [filtroActivo, setFiltroActivo] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Control de secciones expandidas
  const [seccionExpandida, setSeccionExpandida] = useState('');

  // Modal de detalles
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

      // Intentar cargar evolución de forma separada con manejo de errores
      // Este endpoint puede fallar sin romper toda la página
      try {
        const evolucion = await fetchEvolucionLicencias({ meses: 12 });
        setEvolucionLicencias(evolucion.data || []);
      } catch (error) {
        console.warn('Error cargando evolución de licencias:', error);
        setEvolucionLicencias([]);
      }
    } catch (error) {
      console.error('Error cargando datos de RRHH:', error);
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
      addNotification('success', 'Empleado dado de baja', `${nombreCompleto} ha sido dado de baja correctamente.`);
      loadData();
    } catch (error) {
      console.error('Error dando de baja:', error);
      addNotification('error', 'Error', 'No se pudo dar de baja al empleado.');
    } finally {
      setProcesandoBaja(null);
    }
  };

  // Función para abrir modal con detalles
  const abrirModalConDatos = (titulo, datos) => {
    setDatosModal({ titulo, datos });
    setModalAbierto(true);
  };

  // Helpers
  const getMesNombre = (m) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[m - 1];
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    const fecha = fechaString.split('T')[0];
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}-${mes}-${anio}`;
  };

  const getTipoContratoColor = (tipo) => {
    const colors = {
      'indefinido': 'bg-green-100 text-green-800',
      'plazo_fijo': 'bg-yellow-100 text-yellow-800',
      'practicante': 'bg-blue-100 text-blue-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  // Filtrar datos por búsqueda
  const rankingFiltrado = rankingLicencias.filter(emp =>
    emp.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    emp.numero_empleado?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) {
    return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando análisis de RRHH...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header Compacto */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard RRHH</h1>
            <p className="text-sm text-blue-100 mt-1">Gestión de personal y análisis de rendimiento</p>
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

      {/* Filtros Compactos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <Calendar size={18} className="text-gray-500" />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
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

          <div className="ml-auto">
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-64"
            />
          </div>
        </div>
      </div>

      {/* Tarjetas Interactivas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => abrirModalConDatos('Personal Indefinido', rankingFiltrado.filter(e => e.tipo_contrato === 'indefinido'))}
          className="cursor-pointer transform hover:scale-105 transition-transform"
        >
          <MetricCard
            title="Personal Indefinido"
            value={resumenContratos.indefinido || 0}
            icon={Users}
            color="green"
            subtitle="Click para ver detalles"
          />
        </div>

        <div
          onClick={() => abrirModalConDatos('Personal a Plazo Fijo', rankingFiltrado.filter(e => e.tipo_contrato === 'plazo_fijo'))}
          className="cursor-pointer transform hover:scale-105 transition-transform"
        >
          <MetricCard
            title="Personal a Plazo"
            value={resumenContratos.plazo_fijo || 0}
            icon={FileText}
            color="orange"
            subtitle="Click para ver detalles"
          />
        </div>

        <div
          onClick={() => abrirModalConDatos('Practicantes', rankingFiltrado.filter(e => e.tipo_contrato === 'practicante'))}
          className="cursor-pointer transform hover:scale-105 transition-transform"
        >
          <MetricCard
            title="Practicantes"
            value={resumenContratos.practicante || 0}
            icon={Users}
            color="blue"
            subtitle="Click para ver detalles"
          />
        </div>

        <div
          onClick={() => abrirModalConDatos('Contratos por Vencer', alertasContratos)}
          className="cursor-pointer transform hover:scale-105 transition-transform"
        >
          <MetricCard
            title="Vencen Este Mes"
            value={resumenContratos.vencen_proximo_mes || 0}
            icon={AlertTriangle}
            color="red"
            subtitle="Click para ver detalles"
          />
        </div>
      </div>

      {/* Top 10 Empleados con Más Licencias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown size={20} className="text-orange-600" />
            Top 10 - Empleados con Más Licencias
          </h2>
          {rankingLicencias.length > 10 && (
            <button
              onClick={() => abrirModalConDatos('Ranking Completo de Licencias', rankingLicencias)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver todos ({rankingLicencias.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {rankingFiltrado.slice(0, 10).map((empleado, index) => (
            <div
              key={empleado.id}
              className={`border-2 rounded-lg p-3 ${
                empleado.alerta_rendimiento ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="text-center mb-2">
                <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-gray-900 truncate">{empleado.nombre_completo}</p>
                <p className="text-xs text-gray-500 mb-2">{empleado.numero_empleado}</p>
                <div className="flex justify-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getTipoContratoColor(empleado.tipo_contrato)}`}>
                    {empleado.tipo_contrato}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    empleado.total_licencias >= 5 ? 'bg-red-100 text-red-800' :
                    empleado.total_licencias >= 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {empleado.total_licencias} licencias
                  </span>
                  <p className="text-xs text-gray-600 mt-1">{empleado.total_dias_licencia} días</p>
                </div>
                {empleado.alerta_rendimiento && empleado.tipo_contrato === 'plazo_fijo' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDarDeBaja(empleado.id, empleado.nombre_completo);
                    }}
                    disabled={procesandoBaja === empleado.id}
                    className="mt-2 w-full px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold"
                  >
                    {procesandoBaja === empleado.id ? 'Procesando...' : 'No Renovar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráficos en Grid Compacto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Distribución de Contratos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución de Contratos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Indefinido', value: resumenContratos.indefinido || 0 },
                  { name: 'Plazo Fijo', value: resumenContratos.plazo_fijo || 0 },
                  { name: 'Practicante', value: resumenContratos.practicante || 0 }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#3b82f6" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 Licencias */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 - Licencias y Días</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rankingLicencias.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre_completo" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_licencias" fill="#3b82f6" name="Cantidad de Licencias" />
              <Bar dataKey="total_dias_licencia" fill="#ef4444" name="Total Días" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficos Adicionales para Gerencia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Distribución de Licencias por Tipo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tipos de Licencias</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: 'Médicas',
                    value: rankingLicencias.reduce((sum, emp) => sum + (emp.licencias_medicas || 0), 0)
                  },
                  {
                    name: 'Administrativas',
                    value: rankingLicencias.reduce((sum, emp) => sum + (emp.licencias_administrativas || 0), 0)
                  },
                  {
                    name: 'Permisos',
                    value: rankingLicencias.reduce((sum, emp) => sum + (emp.permisos || 0), 0)
                  }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#ef4444" />
                <Cell fill="#3b82f6" />
                <Cell fill="#10b981" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Empleados de Alto Riesgo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Empleados de Alto Riesgo</h3>
            {empleadosAltoRiesgo.length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-bold rounded-full">
                {empleadosAltoRiesgo.length} alertas
              </span>
            )}
          </div>
          {empleadosAltoRiesgo.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              <div className="text-center">
                <AlertTriangle size={48} className="mx-auto mb-2" />
                <p>No hay empleados de alto riesgo</p>
              </div>
            </div>
          ) : (
            <div className="max-h-[250px] overflow-y-auto space-y-2">
              {empleadosAltoRiesgo.slice(0, 5).map((emp) => (
                <div key={emp.id} className="p-3 border-l-4 border-red-500 bg-red-50 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{emp.nombre_completo}</p>
                      <p className="text-xs text-gray-600">
                        {emp.total_licencias} licencias • {emp.total_dias_licencia} días
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-red-700">
                        Vence en {emp.dias_restantes} días
                      </p>
                      <p className="text-xs text-gray-500">{formatFecha(emp.fecha_termino)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {empleadosAltoRiesgo.length > 5 && (
                <button
                  onClick={() => abrirModalConDatos('Empleados de Alto Riesgo - Completo', empleadosAltoRiesgo)}
                  className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver todos ({empleadosAltoRiesgo.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Evolución Temporal de Licencias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Evolución de Licencias - Últimos 12 Meses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evolucionLicencias}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="total_licencias" stroke="#3b82f6" strokeWidth={2} name="Cantidad Licencias" dot={{ r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="total_dias" stroke="#ef4444" strokeWidth={2} name="Total Días" dot={{ r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="promedio_dias_por_empleado" stroke="#10b981" strokeWidth={2} name="Promedio Días/Empleado" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600">Total Licencias (12 meses)</p>
            <p className="text-xl font-bold text-blue-600">
              {evolucionLicencias.reduce((sum, item) => sum + item.total_licencias, 0)}
            </p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-600">Total Días (12 meses)</p>
            <p className="text-xl font-bold text-red-600">
              {evolucionLicencias.reduce((sum, item) => sum + item.total_dias, 0)}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600">Promedio Mensual</p>
            <p className="text-xl font-bold text-green-600">
              {evolucionLicencias.length > 0
                ? Math.round(evolucionLicencias.reduce((sum, item) => sum + item.total_licencias, 0) / evolucionLicencias.length)
                : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Detalles */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
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
                  {datosModal.datos.map((emp) => (
                    <div key={emp.id || emp.numero_empleado} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Nombre</p>
                          <p className="font-semibold">{emp.nombre_completo || `${emp.nombre} ${emp.apellido}`}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">N° Empleado</p>
                          <p className="font-semibold">{emp.numero_empleado}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tipo Contrato</p>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getTipoContratoColor(emp.tipo_contrato)}`}>
                            {emp.tipo_contrato}
                          </span>
                        </div>
                        {emp.total_licencias !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500">Licencias</p>
                            <p className="font-semibold">{emp.total_licencias} ({emp.total_dias_licencia} días)</p>
                          </div>
                        )}
                        {emp.fecha_termino && (
                          <div>
                            <p className="text-xs text-gray-500">Vencimiento</p>
                            <p className="font-semibold text-red-600">{formatFecha(emp.fecha_termino)}</p>
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