import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, FileText, TrendingDown, Ban, Calendar } from 'lucide-react';
import {
  fetchAlertasContratos,
  fetchRankingLicencias,
  fetchResumenContratos,
  fetchEmpleadosAltoRiesgo,
  updateEmpleado
} from '../services/api';
import MetricCard from '../components/cards/MetricCard';
import { useNotifications } from '../context/NotificationContext';

export default function AnalisisRRHHPage() {
  const [alertasContratos, setAlertasContratos] = useState([]);
  const [rankingLicencias, setRankingLicencias] = useState([]);
  const [resumenContratos, setResumenContratos] = useState({});
  const [empleadosAltoRiesgo, setEmpleadosAltoRiesgo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesandoBaja, setProcesandoBaja] = useState(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [filtroActivo, setFiltroActivo] = useState(false);

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
        fetchEmpleadosAltoRiesgo(params),
      ]);

      setAlertasContratos(alertas.data || []);
      setRankingLicencias(ranking.data || []);
      setResumenContratos(resumen.data || {});
      setEmpleadosAltoRiesgo(altoRiesgo.data || []);
    } catch (error) {
      console.error('Error cargando datos de RRHH:', error);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de RRHH.');
    } finally {
      setLoading(false);
    }
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

  const getSeveridadColor = (severidad) => {
    const colors = {
      'critica': 'bg-red-100 text-red-800 border-red-300',
      'alta': 'bg-orange-100 text-orange-800 border-orange-300',
      'media': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'baja': 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[severidad] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTipoContratoColor = (tipo) => {
    const colors = {
      'indefinido': 'bg-green-100 text-green-800',
      'plazo_fijo': 'bg-yellow-100 text-yellow-800',
      'practicante': 'bg-blue-100 text-blue-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando análisis de RRHH...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Recursos Humanos</h1>
          <p className="mt-2 text-blue-200 max-w-xl">
            Gestión de contratos, análisis de rendimiento y alertas de personal
          </p>
        </div>
        <Users className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Filtros de Período */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <Calendar size={20} className="text-gray-500" />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-700">Filtrar por período</span>
            </label>
          </div>

          {filtroActivo && (
            <>
              <select
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>{getMesNombre(m)}</option>
                ))}
              </select>

              <select
                value={anio}
                onChange={(e) => setAnio(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}

          {!filtroActivo && (
            <span className="text-sm text-gray-500 italic">Mostrando todos los datos disponibles</span>
          )}
        </div>
      </div>

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
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      empleado.total_licencias >= 5 ? 'bg-red-100 text-red-800' :
                      empleado.total_licencias >= 3 ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
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

    </div>
  );
}
