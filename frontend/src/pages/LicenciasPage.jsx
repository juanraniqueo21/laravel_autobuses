import React, { useState, useEffect } from 'react';
import {
  fetchLicencias,
  fetchEmpleados,
  crearLicencia,
  actualizarLicencia,
  aprobarLicencia,
  rechazarLicencia,
  eliminarLicencia,
  descargarPdfLicencia,
} from '../services/api';

// Helper para formatear fecha (evita el desfase de un día)
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
};

const LicenciasPage = () => {
  const [licencias, setLicencias] = useState([]);
  const [licenciasFiltradas, setLicenciasFiltradas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Filtros
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLicencia, setCurrentLicencia] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Estado del formulario
  const [formData, setFormData] = useState({
    empleado_id: '',
    tipo: 'licencia_medica',
    fecha_inicio: '',
    fecha_termino: '',
    motivo: '',
    observaciones: '',
    archivo_pdf: null,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (currentUser) {
      cargarDatos();
    }
  }, [currentUser]);

  useEffect(() => {
    aplicarFiltros();
  }, [licencias, filtroEmpleado, filtroEstado, filtroTipo]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [licenciasData, empleadosData] = await Promise.all([
        fetchLicencias(),
        fetchEmpleados(),
      ]);

      setLicencias(licenciasData);
      setEmpleados(empleadosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...licencias];

    if (filtroEmpleado) {
      resultado = resultado.filter((l) => l.empleado_id === parseInt(filtroEmpleado));
    }

    if (filtroEstado) {
      resultado = resultado.filter((l) => l.estado === filtroEstado);
    }

    if (filtroTipo) {
      resultado = resultado.filter((l) => l.tipo === filtroTipo);
    }

    setLicenciasFiltradas(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroEmpleado('');
    setFiltroEstado('');
    setFiltroTipo('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no debe superar los 5MB');
        e.target.value = '';
        return;
      }
      setFormData((prev) => ({ ...prev, archivo_pdf: file }));
    } else {
      setError('Solo se permiten archivos PDF');
      e.target.value = '';
    }
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setCurrentLicencia(null);
    setFormData({
      empleado_id: '',
      tipo: 'licencia_medica',
      fecha_inicio: '',
      fecha_termino: '',
      motivo: '',
      observaciones: '',
      archivo_pdf: null,
    });
    setShowModal(true);
  };

  const abrirModalEditar = (licencia) => {
    if (licencia.estado && licencia.estado !== 'solicitado') {
      setError('Solo se pueden editar licencias en estado "solicitado"');
      return;
    }

    setIsEditing(true);
    setCurrentLicencia(licencia);
    setFormData({
      empleado_id: licencia.empleado_id,
      tipo: licencia.tipo,
      fecha_inicio: licencia.fecha_inicio ? licencia.fecha_inicio.split('T')[0] : '',
      fecha_termino: licencia.fecha_termino ? licencia.fecha_termino.split('T')[0] : '',
      motivo: licencia.motivo || '',
      observaciones: licencia.observaciones || '',
      archivo_pdf: null,
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentLicencia(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (!formData.empleado_id || !formData.fecha_inicio || !formData.fecha_termino) {
        setError('Complete los campos obligatorios');
        return;
      }

      const data = new FormData();
      data.append('empleado_id', formData.empleado_id);
      data.append('tipo', formData.tipo);
      data.append('fecha_inicio', formData.fecha_inicio);
      data.append('fecha_termino', formData.fecha_termino);
      data.append('motivo', formData.motivo);
      data.append('observaciones', formData.observaciones);
      if (formData.archivo_pdf) {
        data.append('archivo_pdf', formData.archivo_pdf);
      }

      if (isEditing) {
        await actualizarLicencia(currentLicencia.id, data);
        setSuccess('Licencia actualizada exitosamente');
      } else {
        await crearLicencia(data);
        setSuccess('Licencia creada exitosamente');
      }

      cerrarModal();
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAprobar = async (id) => {
    if (!window.confirm('¿Aprobar esta licencia?')) return;

    try {
      setError(null);
      await aprobarLicencia(id);
      setSuccess('Licencia aprobada. El empleado ha sido marcado como "en licencia".');
      cargarDatos();
    } catch (err) {
      setError('Error al aprobar: ' + err.message);
    }
  };

  const abrirModalRechazar = (licencia) => {
    setCurrentLicencia(licencia);
    setMotivoRechazo('');
    setShowRechazarModal(true);
  };

  const cerrarModalRechazar = () => {
    setShowRechazarModal(false);
    setCurrentLicencia(null);
    setMotivoRechazo('');
  };

  const handleRechazar = async () => {
    if (!motivoRechazo || motivoRechazo.trim().length < 10) {
      setError('El motivo de rechazo debe tener al menos 10 caracteres');
      return;
    }

    try {
      setError(null);
      await rechazarLicencia(currentLicencia.id, motivoRechazo);
      setSuccess('Licencia rechazada exitosamente');
      cerrarModalRechazar();
      cargarDatos();
    } catch (err) {
      setError('Error al rechazar: ' + err.message);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta licencia? Esta acción no se puede deshacer.')) return;

    try {
      setError(null);
      await eliminarLicencia(id);
      setSuccess('Licencia eliminada exitosamente');
      cargarDatos();
    } catch (err) {
      setError('Error al eliminar: ' + err.message);
    }
  };

  const handleDescargarPdf = async (id) => {
    try {
      setError(null);
      await descargarPdfLicencia(id);
    } catch (err) {
      setError('Error al descargar el PDF: ' + err.message);
    }
  };

  const getEmpleadoNombre = (empleadoId) => {
    const empleado = empleados.find((e) => e.id === empleadoId);
    if (!empleado) return 'Desconocido';
    return `${empleado.user?.nombre || ''} ${empleado.user?.apellido || ''}`.trim();
  };

  const getEmpleadoRut = (empleadoId) => {
    const empleado = empleados.find((e) => e.id === empleadoId);
    if (!empleado || !empleado.user) return '-';
    return `${empleado.user.rut}-${empleado.user.rut_verificador}`;
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'solicitado':
        return 'bg-yellow-100 text-yellow-800';
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      case 'completado':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoLabel = (tipo) => {
    const tipos = {
      permiso: 'Permiso',
      vacaciones: 'Vacaciones',
      licencia_medica: 'Licencia Médica',
      licencia_maternidad: 'Licencia Maternidad',
      licencia_paternidad: 'Licencia Paternidad',
    };
    return tipos[tipo] || tipo;
  };

  const puedeAprobarRechazar = () => {
    return currentUser && [1, 2, 6].includes(currentUser.rol_id);
  };

  const puedeEliminar = () => {
    return currentUser && [1, 6].includes(currentUser.rol_id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Cargando licencias...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Licencias</h1>
        <p className="text-gray-600">Administra las solicitudes de licencias médicas, permisos y vacaciones</p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Filtros y Botón Crear */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro Empleado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
            <select
              value={filtroEmpleado}
              onChange={(e) => setFiltroEmpleado(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {empleados
                .filter((emp) => emp.estado === 'activo')
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {getEmpleadoNombre(emp.id)} ({getEmpleadoRut(emp.id)})
                  </option>
                ))}
            </select>
          </div>

          {/* Filtro Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="solicitado">Solicitado</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="completado">Completado</option>
            </select>
          </div>

          {/* Filtro Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="licencia_medica">Licencia Médica</option>
              <option value="permiso">Permiso</option>
              <option value="vacaciones">Vacaciones</option>
              <option value="licencia_maternidad">Licencia Maternidad</option>
              <option value="licencia_paternidad">Licencia Paternidad</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex items-end gap-2">
            <button
              onClick={limpiarFiltros}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
            >
              Limpiar
            </button>
            <button
              onClick={abrirModalCrear}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              + Nueva
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Licencias */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Término
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Días
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PDF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {licenciasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No se encontraron licencias
                  </td>
                </tr>
              ) : (
                licenciasFiltradas.map((licencia) => (
                  <tr key={licencia.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getEmpleadoNombre(licencia.empleado_id)}
                      </div>
                      <div className="text-sm text-gray-500">{getEmpleadoRut(licencia.empleado_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTipoLabel(licencia.tipo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(licencia.fecha_inicio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(licencia.fecha_termino)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {licencia.dias_totales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {licencia.estado ? (
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadgeClass(
                            licencia.estado
                          )}`}
                        >
                          {licencia.estado.charAt(0).toUpperCase() + licencia.estado.slice(1)}
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Sin estado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {licencia.ruta_archivo ? (
                        <button
                          onClick={() => handleDescargarPdf(licencia.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver PDF
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2 flex-wrap">
                        {/* Botones para licencias sin estado o en estado solicitado */}
                        {(!licencia.estado || licencia.estado === 'solicitado') && (
                          <>
                            <button
                              onClick={() => abrirModalEditar(licencia)}
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Editar
                            </button>

                            {puedeAprobarRechazar() && (
                              <>
                                <button
                                  onClick={() => handleAprobar(licencia.id)}
                                  className="text-green-600 hover:text-green-900 font-medium"
                                >
                                  Aprobar
                                </button>
                                <button
                                  onClick={() => abrirModalRechazar(licencia)}
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                          </>
                        )}

                        {/* Botón Eliminar - Siempre visible para Admin/RRHH */}
                        {puedeEliminar() && (
                          <button
                            onClick={() => handleEliminar(licencia.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Eliminar
                          </button>
                        )}

                        {/* Si no hay ningún botón, mostrar guión */}
                        {licencia.estado && licencia.estado !== 'solicitado' && !puedeEliminar() && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {isEditing ? 'Editar Licencia' : 'Nueva Licencia'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Empleado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empleado *
                  </label>
                  <select
                    name="empleado_id"
                    value={formData.empleado_id}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    required
                  >
                    <option value="">Seleccione un empleado...</option>
                    {empleados
                      .filter((emp) => emp.estado === 'activo')
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {getEmpleadoNombre(emp.id)} ({getEmpleadoRut(emp.id)})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    required
                  >
                    <option value="licencia_medica">Licencia Médica</option>
                    <option value="permiso">Permiso</option>
                    <option value="vacaciones">Vacaciones</option>
                    <option value="licencia_maternidad">Licencia Maternidad</option>
                    <option value="licencia_paternidad">Licencia Paternidad</option>
                  </select>
                </div>

                {/* Archivo PDF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo PDF {!isEditing && '*'}
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    required={!isEditing}
                  />
                  {isEditing && currentLicencia?.nombre_archivo && (
                    <p className="text-xs text-green-600 mt-1">
                      Archivo actual: {currentLicencia.nombre_archivo}
                    </p>
                  )}
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Inicio *
                    </label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={formData.fecha_inicio}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Término *
                    </label>
                    <input
                      type="date"
                      name="fecha_termino"
                      value={formData.fecha_termino}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3"
                      required
                    />
                  </div>
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
                  <textarea
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    placeholder="Motivo de la licencia..."
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {isEditing ? 'Actualizar' : 'Crear'} Licencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rechazar */}
      {showRechazarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Rechazar Licencia</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo del rechazo *
              </label>
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Explique el motivo del rechazo (mínimo 10 caracteres)..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 10 caracteres</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cerrarModalRechazar}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazar}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Rechazar Licencia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenciasPage;