import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, XCircle, Clock, Filter,
  Search, Download, Eye, AlertTriangle, Calendar, BarChart3
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { 
  fetchReportes, 
  aprobarReporte, 
  rechazarReporte, 
  descargarDocumentoReporte 
} from '../services/api';

const ReportesPage = () => {
  const { addNotification } = useNotifications();
  
  // Estados de datos
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendientes: 0, aprobados: 0, rechazados: 0 });

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    estado: '',
    tipo: '',
    fecha_desde: '',
    fecha_hasta: '',
    search: '' // búsqueda local por nombre/título
  });

  // Estados del Modal
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Estado para rechazo
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveObservation, setApproveObservation] = useState('');

  // Cargar datos al cambiar filtros "serios" (no el search local)
  useEffect(() => {
    cargarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.estado, filtros.tipo, filtros.fecha_desde, filtros.fecha_hasta]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      // Limpiar filtros vacíos para la API
      const cleanFiltros = Object.fromEntries(
        Object.entries(filtros).filter(([key, v]) => key !== 'search' && v !== '')
      );
      
      const data = await fetchReportes(cleanFiltros);
      
      // Filtrado local por búsqueda de texto (si aplica)
      let filteredData = data;
      if (filtros.search) {
        const term = filtros.search.toLowerCase();
        filteredData = data.filter(r => 
          r.titulo.toLowerCase().includes(term) ||
          r.empleado?.user?.nombre?.toLowerCase().includes(term) ||
          r.empleado?.user?.apellido?.toLowerCase().includes(term)
        );
      }

      setReportes(filteredData);
      calcularEstadisticas(filteredData);
    } catch (error) {
      addNotification('error', 'Error', 'No se pudieron cargar los reportes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (data) => {
    setStats({
      pendientes: data.filter(r => r.estado === 'pendiente').length,
      aprobados: data.filter(r => r.estado === 'aprobado').length,
      rechazados: data.filter(r => r.estado === 'rechazado').length,
    });
  };

  const handleClearFilters = () => {
    setFiltros({
      estado: '',
      tipo: '',
      fecha_desde: '',
      fecha_hasta: '',
      search: ''
    });
  };

  // Acciones
  const handleDownload = async (id, nombreArchivo) => {
    try {
      await descargarDocumentoReporte(id);
      addNotification('success', 'Descarga iniciada', `Descargando ${nombreArchivo}...`);
    } catch (error) {
      addNotification('error', 'Error', 'No se pudo descargar el archivo adjunto');
    }
  };

  const handleAprobar = async () => {
    try {
      setActionLoading(true);
      await aprobarReporte(selectedReporte.id, approveObservation);
      addNotification('success', 'Éxito', 'Reporte aprobado correctamente');
      closeModal();
      cargarReportes();
    } catch (error) {
      addNotification('error', 'Error', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!rejectReason || rejectReason.length < 10) {
      addNotification('warning', 'Atención', 'Debe indicar un motivo de rechazo (mín. 10 caracteres)');
      return;
    }
    try {
      setActionLoading(true);
      await rechazarReporte(selectedReporte.id, rejectReason);
      addNotification('success', 'Éxito', 'Reporte rechazado');
      closeModal();
      cargarReportes();
    } catch (error) {
      addNotification('error', 'Error', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (reporte) => {
    setSelectedReporte(reporte);
    setShowModal(true);
    setShowRejectInput(false);
    setRejectReason('');
    setApproveObservation('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReporte(null);
  };

  // Helpers UI
  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aprobado': return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGravedadColor = (gravedad) => {
    switch (gravedad) {
      case 'critica': return 'text-red-600 font-bold bg-red-50 px-2 rounded';
      case 'alta': return 'text-orange-600 font-medium';
      case 'media': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const formatTipo = (tipo) => {
    if (!tipo) return '-';
    return tipo
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER CON GRADIENTE (igual estilo EmployeesPage) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Reportes</h1>
            <p className="mt-2 text-slate-300 max-w-xl">
              Administra los reportes de incidentes, ausencias y observaciones generados por el personal.
            </p>
          </div>

          {/* Tarjetas pequeñas de resumen en el header */}
          <div className="grid grid-cols-3 gap-3 min-w-[260px]">
            <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-200">Pendientes</span>
                <Clock size={16} className="text-yellow-300" />
              </div>
              <p className="mt-1 text-2xl font-bold">{stats.pendientes}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-200">Aprobados</span>
                <CheckCircle size={16} className="text-emerald-300" />
              </div>
              <p className="mt-1 text-2xl font-bold">{stats.aprobados}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-200">Rechazados</span>
                <XCircle size={16} className="text-red-300" />
              </div>
              <p className="mt-1 text-2xl font-bold">{stats.rechazados}</p>
            </div>
          </div>
        </div>
        <BarChart3 className="absolute right-6 bottom-[-24px] h-44 w-44 text-white/5 rotate-12" />
      </div>

      {/* FILTROS (mismo estilo de tarjeta que EmployeesPage) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row flex-wrap gap-4 items-end">
        {/* Búsqueda de texto */}
        <div className="relative flex-1 min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">
            Buscar
          </label>
          <Search className="absolute left-3 top-9 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Empleado, título, tipo..."
            value={filtros.search}
            onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Estado */}
        <div className="w-full md:w-40">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">
            Estado
          </label>
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>

        {/* Tipo de reporte */}
        <div className="w-full md:w-56">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">
            Tipo de Reporte
          </label>
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="">Todos</option>
            <option value="ausencia_enfermedad">Ausencia (Enfermedad)</option>
            <option value="ausencia_personal">Ausencia (Personal)</option>
            <option value="incidente_ruta">Incidente en Ruta</option>
            <option value="problema_mecanico">Problema Mecánico</option>
            <option value="accidente_transito">Accidente Tránsito</option>
            <option value="queja_pasajero">Queja Pasajero</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Fecha Desde */}
        <div className="w-full md:w-40">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">
            Desde
          </label>
          <input
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          />
        </div>

        {/* Fecha Hasta */}
        <div className="w-full md:w-40">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">
            Hasta
          </label>
          <input
            type="date"
            value={filtros.fecha_hasta}
            onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          />
        </div>

        {/* Botón limpiar */}
        {(filtros.search || filtros.estado || filtros.tipo || filtros.fecha_desde || filtros.fecha_hasta) && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium border border-gray-200 flex items-center gap-2"
          >
            <Filter size={16} /> Limpiar
          </button>
        )}
      </div>

      {/* TABLA DE RESULTADOS (mismo tipo de tarjeta que empleados) */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando reportes...</div>
        ) : reportes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-800">No se encontraron reportes</h3>
            <p className="text-gray-500 text-sm mt-1">
              Ajusta los filtros o la búsqueda para ver otros resultados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Empleado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Tipo / Gravedad</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Asunto</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {reportes.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar size={16} className="text-gray-400" />
                        {new Date(reporte.fecha_incidente).toLocaleDateString('es-CL')}
                      </div>
                      {reporte.hora_incidente && (
                        <div className="text-xs text-gray-400 ml-6">
                          {reporte.hora_incidente.substring(0, 5)} hrs
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {reporte.empleado?.user?.nombre} {reporte.empleado?.user?.apellido}
                      </div>
                      <div className="text-xs text-gray-500">
                        RUT: {reporte.empleado?.user?.rut}-{reporte.empleado?.user?.rut_verificador}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800">
                        {formatTipo(reporte.tipo)}
                      </div>
                      {reporte.gravedad && (
                        <span className={`text-xs ${getGravedadColor(reporte.gravedad)}`}>
                          {reporte.gravedad.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-gray-800 max-w-xs truncate"
                        title={reporte.titulo}
                      >
                        {reporte.titulo}
                      </div>
                      {reporte.ruta_documento && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                          <FileText size={12} /> Adjunto disponible
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getBadgeColor(
                          reporte.estado
                        )}`}
                      >
                        {reporte.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(reporte)}
                        className="inline-flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETALLE/APROBACIÓN */}
      {showModal && selectedReporte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Header modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Detalle del Reporte #{selectedReporte.id}
                </h2>
                <p className="text-sm text-gray-500">
                  Enviado por: {selectedReporte.empleado?.user?.nombre}{' '}
                  {selectedReporte.empleado?.user?.apellido}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Body modal */}
            <div className="p-6 space-y-6">
              {/* Info principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Estado Actual
                    </label>
                    <div
                      className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${getBadgeColor(
                        selectedReporte.estado
                      )}`}
                    >
                      {selectedReporte.estado.toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Tipo de Reporte
                    </label>
                    <p className="font-medium text-gray-800">
                      {formatTipo(selectedReporte.tipo)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Fecha Incidente
                    </label>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedReporte.fecha_incidente).toLocaleDateString('es-CL')}
                      {selectedReporte.hora_incidente &&
                        ` - ${selectedReporte.hora_incidente.substring(0, 5)} hrs`}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedReporte.bus && (
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase">
                        Bus Involucrado
                      </label>
                      <p className="font-medium text-gray-800">
                        {selectedReporte.bus.patente} - {selectedReporte.bus.marca}{' '}
                        {selectedReporte.bus.modelo}
                      </p>
                    </div>
                  )}

                  {selectedReporte.ubicacion && (
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase">
                        Ubicación
                      </label>
                      <p className="font-medium text-gray-800 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-500" />
                        {selectedReporte.ubicacion}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="border-t border-gray-100 pt-4">
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                  Descripción Detallada
                </label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedReporte.descripcion}
                </div>
              </div>

              {/* Adjuntos */}
              {selectedReporte.ruta_documento && (
                <div className="border-t border-gray-100 pt-4">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                    Evidencia Adjunta
                  </label>
                  <button
                    onClick={() =>
                      handleDownload(selectedReporte.id, selectedReporte.nombre_documento)
                    }
                    className="flex items-center gap-3 w-full p-4 border border-blue-100 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                  >
                    <div className="bg-white p-2 rounded-md shadow-sm text-blue-600">
                      <FileText size={24} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-blue-900">
                        {selectedReporte.nombre_documento}
                      </p>
                      <p className="text-xs text-blue-600">
                        Clic para descargar archivo
                      </p>
                    </div>
                    <Download className="text-blue-400 group-hover:text-blue-600" />
                  </button>
                </div>
              )}

              {/* Info de revisión si ya fue revisado */}
              {selectedReporte.estado !== 'pendiente' && (
                <div className="border-t border-gray-100 pt-4">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                    Información de Revisión
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    <p>
                      <span className="font-semibold">Revisado por:</span>{' '}
                      {selectedReporte.revisor?.nombre || 'Sistema'}{' '}
                      {selectedReporte.revisor?.apellido}
                    </p>
                    {selectedReporte.fecha_revision && (
                      <p>
                        <span className="font-semibold">Fecha:</span>{' '}
                        {new Date(
                          selectedReporte.fecha_revision
                        ).toLocaleString('es-CL')}
                      </p>
                    )}
                    {selectedReporte.observaciones_revision && (
                      <p className="mt-2">
                        <span className="font-semibold">Observaciones:</span>{' '}
                        {selectedReporte.observaciones_revision}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones si está pendiente */}
              {selectedReporte.estado === 'pendiente' && (
                <div className="border-t border-gray-100 pt-6 mt-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Resolución del Reporte
                  </h3>

                  {/* Vista normal (aprobar / rechazar) */}
                  {!showRejectInput && (
                    <div className="space-y-4">
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        rows="2"
                        placeholder="Observaciones opcionales para aprobación..."
                        value={approveObservation}
                        onChange={(e) => setApproveObservation(e.target.value)}
                      ></textarea>

                      <div className="flex flex-col md:flex-row gap-3">
                        <button
                          onClick={handleAprobar}
                          disabled={actionLoading}
                          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition flex justify-center items-center gap-2 font-semibold disabled:opacity-50"
                        >
                          {actionLoading ? (
                            'Procesando...'
                          ) : (
                            <>
                              <CheckCircle size={20} /> Aprobar Reporte
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setShowRejectInput(true)}
                          disabled={actionLoading}
                          className="flex-1 bg-white border-2 border-red-100 text-red-600 py-3 rounded-lg hover:bg-red-50 transition flex justify-center items-center gap-2 font-semibold"
                        >
                          <XCircle size={20} /> Rechazar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Vista de rechazo */}
                  {showRejectInput && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 mt-4">
                      <h4 className="font-bold text-red-800 mb-1">
                        Motivo del Rechazo
                      </h4>
                      <p className="text-xs text-red-600 mb-2">
                        Indique por qué se rechaza este reporte (mínimo 10 caracteres).
                      </p>
                      <textarea
                        className="w-full border border-red-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        rows="3"
                        placeholder="Escriba el motivo aquí..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        autoFocus
                      ></textarea>
                      <div className="flex justify-end gap-3 mt-3">
                        <button
                          onClick={() => setShowRejectInput(false)}
                          className="text-gray-500 hover:text-gray-700 text-sm font-medium px-4"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleRechazar}
                          disabled={actionLoading}
                          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 text-sm font-semibold shadow-sm"
                        >
                          {actionLoading ? 'Enviando...' : 'Confirmar Rechazo'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportesPage;
