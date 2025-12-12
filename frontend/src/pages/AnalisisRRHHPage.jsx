import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, FileText, TrendingDown, Ban, Calendar, PieChart as PieChartIcon, BarChart3, RefreshCw } from 'lucide-react';
import {
  fetchAlertasContratos,
  fetchRankingLicencias,
  fetchResumenContratos,
  fetchEmpleadosAltoRiesgo,
  updateEmpleado
} from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import MetricCard from '../components/cards/MetricCard';
import { useNotifications } from '../context/NotificationContext';
import AdvancedFilters from '../components/filters/AdvancedFilters';
import { formatFecha, formatCurrency, buildFilterParams } from '../utils/formatters';
import { getTipoContratoColor, getSeveridadColor, getCantidadLicenciasColor } from '../utils/colors';

export default function AnalisisRRHHPage() {
  const [alertasContratos, setAlertasContratos] = useState([]);
  const [rankingLicencias, setRankingLicencias] = useState([]);
  const [resumenContratos, setResumenContratos] = useState({});
  const [empleadosAltoRiesgo, setEmpleadosAltoRiesgo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesandoBaja, setProcesandoBaja] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Estado de filtros avanzados
  const [filters, setFilters] = useState({
    tipo_contrato: '',
    estado_empleado: '',
    fecha_inicio: '',
    fecha_fin: '',
    severidad: '',
    buscar: '',
    tipo_licencia: '',
    dias_vencimiento: '30',
    min_licencias: '3'
  });

  const { addNotification } = useNotifications();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = buildFilterParams(filters);

      const [alertas, ranking, resumen, altoRiesgo] = await Promise.all([
        fetchAlertasContratos(params),
        fetchRankingLicencias(params),
        fetchResumenContratos(params),
        fetchEmpleadosAltoRiesgo(params),
      ]);

      setAlertasContratos(alertas.data || []);
      setRankingLicencias(ranking.data || []);
      setResumenContratos(resumen.data || {});
      setEmpleadosAltoRiesgo(altoRiesgo.data || []);
      setUltimaActualizacion(new Date());
    } catch (error) {
      console.error('Error cargando datos de RRHH:', error);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de RRHH.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadData();
  };

  const handleClearFilters = () => {
    setFilters({
      tipo_contrato: '',
      estado_empleado: '',
      fecha_inicio: '',
      fecha_fin: '',
      severidad: '',
      buscar: '',
      tipo_licencia: '',
      dias_vencimiento: '30',
      min_licencias: '3'
    });
    setTimeout(() => loadData(), 100);
  };

  const handleRefresh = () => {
    addNotification('info', 'Actualizando', 'Recargando datos de RRHH...');
    loadData();
  };

  const handleDarDeBaja = async (empleadoId, nombreCompleto) => {
    if (!window.confirm(`¿Está seguro de dar de baja a ${nombreCompleto}?\n\nEsta acción cambiará su estado a 'terminado'.`)) {
      return;
    }

    try {
      setProcesandoBaja(empleadoId);
      await updateEmpleado(empleadoId, { estado: 'terminado' });
      addNotification('success', 'Empleado dado de baja', `${nombreCompleto} ha sido dado de baja correctamente.`);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error dando de baja:', error);
      addNotification('error', 'Error', 'No se pudo dar de baja al empleado.');
    } finally {
      setProcesandoBaja(null);
    }
  };

  // Configuración de filtros avanzados
  const filterConfig = [
    {
      name: 'tipo_contrato',
      label: 'Tipo de Contrato',
      type: 'select',
      options: [
        { value: 'indefinido', label: 'Indefinido' },
        { value: 'plazo_fijo', label: 'Plazo Fijo' },
        { value: 'practicante', label: 'Practicante' }
      ]
    },
    {
      name: 'estado_empleado',
      label: 'Estado Empleado',
      type: 'select',
      options: [
        { value: 'activo', label: 'Activo' },
        { value: 'licencia', label: 'En Licencia' },
        { value: 'suspendido', label: 'Suspendido' },
        { value: 'terminado', label: 'Terminado' }
      ]
    },
    {
      name: 'tipo_licencia',
      label: 'Tipo de Licencia',
      type: 'select',
      options: [
        { value: 'medica', label: 'Médica' },
        { value: 'administrativa', label: 'Administrativa' },
        { value: 'permiso', label: 'Permiso' }
      ]
    },
    {
      name: 'severidad',
      label: 'Severidad',
      type: 'select',
      options: [
        { value: 'critica', label: 'Crítica' },
        { value: 'alta', label: 'Alta' },
        { value: 'media', label: 'Media' },
        { value: 'baja', label: 'Baja' }
      ]
    },
    {
      name: 'fecha_inicio',
      label: 'Fecha Inicio',
      type: 'date'
    },
    {
      name: 'fecha_fin',
      label: 'Fecha Fin',
      type: 'date'
    },
    {
      name: 'buscar',
      label: 'Buscar Empleado',
      type: 'text',
      placeholder: 'Nombre, email...'
    },
    {
      name: 'dias_vencimiento',
      label: 'Días para Vencimiento',
      type: 'number',
      placeholder: '30',
      min: 1,
      max: 365
    },
    {
      name: 'min_licencias',
      label: 'Mínimo de Licencias',
      type: 'number',
      placeholder: '3',
      min: 1,
      max: 50
    }
  ];

  if (loading) {
    return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando análisis de RRHH...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Recursos Humanos</h1>
            <p className="mt-2 text-blue-200 max-w-xl">
              Gestión de contratos, análisis de rendimiento y alertas de personal
            </p>
            {ultimaActualizacion && (
              <p className="mt-2 text-xs text-blue-300">
                Última actualización: {ultimaActualizacion.toLocaleString('es-CL')}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center gap-2 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
        <Users className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Filtros Avanzados */}
      <AdvancedFilters
        filters={filters}
        onFilterChange={setFilters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        filterConfig={filterConfig}
        isCollapsed={true}
      />

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Personal Indefinido"
          value={resumenContratos.indefinido || 0}
          icon={Users}
          color="green"
          subtitle="Contratos permanentes"
        />
        <MetricCard
          title="Personal a Plazo"
          value={resumenContratos.plazo_fijo || 0}
          icon={FileText}
          color="orange"
          subtitle="Contratos temporales"
        />
        <MetricCard
          title="Practicantes"
          value={resumenContratos.practicante || 0}
          icon={Users}
          color="blue"
          subtitle="En formación"
        />
        <MetricCard
          title="Vencen Este Mes"
          value={resumenContratos.vencen_proximo_mes || 0}
          icon={AlertTriangle}
          color="red"
          subtitle="Contratos a renovar"
        />
      </div>

      {/* Alertas de Contratos Próximos a Vencer */}
      {alertasContratos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-600" />
            Contratos Próximos a Vencer
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({alertasContratos.length} contratos)
            </span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">N° Empleado</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Nombre Completo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo Contrato</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Fecha Término</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Días Restantes</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Urgencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {alertasContratos.map((empleado) => (
                  <tr
                    key={empleado.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      empleado.severidad === 'critica' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-4 py-4 font-mono text-sm font-bold text-gray-900">{empleado.numero_empleado}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{empleado.nombre} {empleado.apellido}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{empleado.email}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTipoContratoColor(empleado.tipo_contrato)}`}>
                        {empleado.tipo_contrato}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-700">
                      {formatFecha(empleado.fecha_termino)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        empleado.dias_restantes <= 7 ? 'bg-red-100 text-red-800' :
                        empleado.dias_restantes <= 15 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {empleado.dias_restantes} días
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeveridadColor(empleado.severidad)}`}>
                        {empleado.severidad.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detector de Rendimiento - Ranking de Licencias */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingDown size={24} className="text-orange-600" />
          Detector de Rendimiento - Ranking de Licencias
          <span className="text-sm font-normal text-gray-500 ml-2">
            (Ordenado por cantidad de licencias)
          </span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Nombre Empleado</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Tipo Contrato</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Total Licencias</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Días Totales</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Médicas</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Administrativas</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Permisos</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rankingLicencias.map((empleado, index) => (
                <tr
                  key={empleado.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    empleado.alerta_rendimiento ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {index < 3 && (
                        <span className="text-xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{empleado.nombre_completo}</div>
                        <div className="text-xs text-gray-500">{empleado.numero_empleado}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTipoContratoColor(empleado.tipo_contrato)}`}>
                      {empleado.tipo_contrato}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getCantidadLicenciasColor(empleado.total_licencias)}`}>
                      {empleado.total_licencias}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-900">
                    {empleado.total_dias_licencia} días
                  </td>
                  <td className="px-4 py-4 text-center text-gray-700">{empleado.licencias_medicas}</td>
                  <td className="px-4 py-4 text-center text-gray-700">{empleado.licencias_administrativas}</td>
                  <td className="px-4 py-4 text-center text-gray-700">{empleado.permisos}</td>
                  <td className="px-4 py-4 text-center">
                    {empleado.alerta_rendimiento ? (
                      <div className="text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                          ⚠️ ALERTA
                        </span>
                        {empleado.motivo_alerta && empleado.motivo_alerta.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            {empleado.motivo_alerta[0]}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        ✓ Normal
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {empleado.alerta_rendimiento && empleado.tipo_contrato === 'plazo_fijo' && (
                      <button
                        onClick={() => handleDarDeBaja(empleado.id, empleado.nombre_completo)}
                        disabled={procesandoBaja === empleado.id}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 mx-auto"
                        title="No Renovar / Desvincular"
                      >
                        {procesandoBaja === empleado.id ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Ban size={14} />
                            No Renovar
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rankingLicencias.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay datos de licencias disponibles
          </div>
        )}
      </div>

      {/* Empleados de Alto Riesgo */}
      {empleadosAltoRiesgo.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-600" />
            Empleados de Alto Riesgo
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Contrato vence pronto + Muchas licencias)
            </span>
          </h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>⚠️ Atención:</strong> Estos empleados combinan dos factores de riesgo:
              contrato próximo a vencer y alto ausentismo. Se recomienda evaluar cuidadosamente su renovación.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-50 border-b-2 border-red-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Empleado</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Fecha Término</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Días Restantes</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Total Licencias</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Días Licencia</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Recomendación</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {empleadosAltoRiesgo.map((empleado) => (
                  <tr key={empleado.id} className="hover:bg-red-50 transition-colors bg-red-25">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{empleado.nombre_completo}</div>
                      <div className="text-xs text-gray-500">{empleado.numero_empleado} • {empleado.email}</div>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-700">
                      {formatFecha(empleado.fecha_termino)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        empleado.dias_restantes <= 15 ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {empleado.dias_restantes} días
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                        {empleado.total_licencias}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-gray-900">
                      {empleado.total_dias_licencia} días
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-xs font-semibold text-red-700">
                        {empleado.recomendacion}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleDarDeBaja(empleado.id, empleado.nombre_completo)}
                        disabled={procesandoBaja === empleado.id}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 mx-auto"
                      >
                        {procesandoBaja === empleado.id ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Ban size={14} />
                            No Renovar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NUEVAS SECCIONES DE VISUALIZACIÓN */}

      {/* Distribución de Contratos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <PieChartIcon size={24} className="text-blue-600" />
          Distribución de Contratos por Tipo
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de torta */}
          <div className="flex justify-center items-center">
            {resumenContratos && (resumenContratos.indefinido || resumenContratos.plazo_fijo || resumenContratos.practicante) ? (
              <ResponsiveContainer width="100%" height={300}>
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
                    outerRadius={100}
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
            ) : (
              <div className="text-center text-gray-500 py-12">No hay datos de contratos</div>
            )}
          </div>

          {/* Resumen estadístico */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Personal Indefinido</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                  Estable
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600">{resumenContratos.indefinido || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Contratos permanentes</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Personal a Plazo Fijo</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                  Temporal
                </span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{resumenContratos.plazo_fijo || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Requieren renovación periódica</div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Practicantes</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                  Formación
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{resumenContratos.practicante || 0}</div>
              <div className="text-xs text-gray-500 mt-1">En proceso de capacitación</div>
            </div>

            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Vencen Este Mes</span>
                <AlertTriangle size={16} className="text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">{resumenContratos.vencen_proximo_mes || 0}</div>
              <div className="text-xs text-red-700 mt-1 font-semibold">Requieren atención inmediata</div>
            </div>
          </div>
        </div>
      </div>

      {/* Análisis de Licencias - Top 10 */}
      {rankingLicencias && rankingLicencias.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 size={24} className="text-orange-600" />
            Top 10 Empleados con Más Licencias
          </h2>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={rankingLicencias.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="nombre_completo"
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_licencias" fill="#f59e0b" name="Total Licencias" />
              <Bar dataKey="total_dias_licencia" fill="#ef4444" name="Días Totales" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Alertas de Contratos con Visualización de Countdown */}
      {alertasContratos && alertasContratos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-600" />
            Alertas de Vencimiento - Visualización Rápida
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alertasContratos.slice(0, 6).map((empleado) => (
              <div
                key={empleado.id}
                className={`border-2 rounded-lg p-4 ${
                  empleado.severidad === 'critica' ? 'border-red-500 bg-red-50' :
                  empleado.severidad === 'alta' ? 'border-orange-500 bg-orange-50' :
                  'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">{empleado.nombre} {empleado.apellido}</h3>
                    <p className="text-xs text-gray-600">{empleado.numero_empleado}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    empleado.severidad === 'critica' ? 'bg-red-600 text-white' :
                    empleado.severidad === 'alta' ? 'bg-orange-600 text-white' :
                    'bg-yellow-600 text-white'
                  }`}>
                    {empleado.severidad.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Tipo:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getTipoContratoColor(empleado.tipo_contrato)}`}>
                      {empleado.tipo_contrato}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Vence:</span>
                    <span className="text-xs font-semibold text-gray-900">{formatFecha(empleado.fecha_termino)}</span>
                  </div>

                  <div className="pt-2 border-t border-gray-300">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${
                        empleado.dias_restantes <= 7 ? 'text-red-600' :
                        empleado.dias_restantes <= 15 ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}>
                        {empleado.dias_restantes}
                      </div>
                      <div className="text-xs text-gray-600 font-semibold">días restantes</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {alertasContratos.length > 6 && (
            <div className="text-center text-sm text-gray-500 mt-4">
              Y {alertasContratos.length - 6} alertas más en la tabla superior...
            </div>
          )}
        </div>
      )}

    </div>
  );
}