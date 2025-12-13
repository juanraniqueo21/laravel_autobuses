import React, { useState, useEffect } from 'react';
import {
  fetchMisLicencias,
  fetchEmpleados,
  crearLicencia,
  actualizarLicencia,
  descargarPdfLicencia,
} from '../../services/api';
import { emitLicenciasActualizadas } from '../../utils/licenseEvents';

const MisLicenciasPage = () => {
  const [licencias, setLicencias] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLicencia, setCurrentLicencia] = useState(null);

  const [formData, setFormData] = useState({
    empleado_id: '',
    tipo: 'licencia_medica',
    fecha_inicio: '',
    fecha_termino: '',
    motivo: '',
    archivo_pdf: null,
  });

  // ✅ FIX: FORMATEO DE FECHA SIN USAR new Date()
  const formatFecha = (fecha) => {
    if (!fecha) return '';

    const str = String(fecha).slice(0, 10); // solo YYYY-MM-DD
    const [y, m, d] = str.split('-');

    if (!y || !m || !d) return fecha;
    return `${d}-${m}-${y}`; // formato CL
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (currentUser) {
      cargarDatos();
    }
  }, [currentUser]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchMisLicencias();
      setLicencias(data);

      const empleadosData = await fetchEmpleados();
      setEmpleados(empleadosData);

      const miEmpleado = empleadosData.find(emp => emp.user_id === currentUser.id);
      if (miEmpleado) {
        setFormData(prev => ({ ...prev, empleado_id: miEmpleado.id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

    const miEmpleado = empleados.find(emp => emp.user_id === currentUser.id);

    setFormData({
      empleado_id: miEmpleado?.id || '',
      tipo: 'licencia_medica',
      fecha_inicio: '',
      fecha_termino: '',
      motivo: '',
      archivo_pdf: null,
    });
    setShowModal(true);
  };

  const abrirModalEditar = (licencia) => {
    if (licencia.estado !== 'solicitado') {
      setError('Solo se pueden editar licencias en estado "solicitado"');
      return;
    }

    setIsEditing(true);
    setCurrentLicencia(licencia);
    setFormData({
      empleado_id: licencia.empleado_id,
      tipo: licencia.tipo,
      fecha_inicio: licencia.fecha_inicio,
      fecha_termino: licencia.fecha_termino,
      motivo: licencia.motivo || '',
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
      if (!formData.empleado_id) {
        setError('Error al identificar empleado');
        return;
      }
      if (!formData.fecha_inicio || !formData.fecha_termino) {
        setError('Debe ingresar fechas de inicio y término');
        return;
      }
      if (!formData.motivo || formData.motivo.trim().length < 10) {
        setError('El motivo debe tener al menos 10 caracteres');
        return;
      }
      if (!isEditing && !formData.archivo_pdf) {
        setError('Debe adjuntar el PDF de la licencia médica');
        return;
      }

      const data = new FormData();
      data.append('empleado_id', formData.empleado_id);
      data.append('tipo', formData.tipo);
      data.append('fecha_inicio', formData.fecha_inicio);
      data.append('fecha_termino', formData.fecha_termino);
      data.append('motivo', formData.motivo);

      if (formData.archivo_pdf) {
        data.append('archivo_pdf', formData.archivo_pdf);
      }

      if (isEditing) {
        await actualizarLicencia(currentLicencia.id, data);
        setSuccess('Licencia actualizada exitosamente');
      } else {
        await crearLicencia(data);
        setSuccess('Licencia solicitada exitosamente.');
      }

      cerrarModal();
      await cargarDatos();
      emitLicenciasActualizadas();
    } catch (err) {
      setError(err.message);
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

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'solicitado': return 'bg-yellow-100 text-yellow-800';
      case 'aprobado': return 'bg-green-100 text-green-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      case 'completado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getTipoIcon = (tipo) => {
    const iconos = {
      licencia_medica: '',
      vacaciones: '',
      permiso: '',
      licencia_maternidad: '',
      licencia_paternidad: '',
    };
    return iconos[tipo] || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Cargando licencias...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis Licencias</h1>
        
      </div>

      {/* Botón Nueva Solicitud */}
      <div className="mb-6">
        <button
          onClick={abrirModalCrear}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-lg font-semibold"
        >
          <span className="text-2xl">+</span>
          Solicitar Nueva Licencia
        </button>
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

      {/* Lista */}
      <div className="space-y-4">
        {licencias.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes licencias registradas</h3>
            <p className="text-gray-500">Haz clic en "Solicitar Nueva Licencia"</p>
          </div>
        ) : (
          licencias.map((licencia) => (
            <div key={licencia.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">

                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">
                      {getTipoIcon(licencia.tipo)}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {getTipoLabel(licencia.tipo)}
                      </h3>

                      <div className="text-sm text-gray-600 space-y-1">

                        {/* FECHAS (FIX APLICADO) */}
                        <p>
                          <span className="font-semibold">Desde:</span> {formatFecha(licencia.fecha_inicio)}
                          {' → '}
                          <span className="font-semibold">Hasta:</span> {formatFecha(licencia.fecha_termino)}
                        </p>

                        <p>
                          ⏱️ <span className="font-semibold">Duración:</span> {licencia.dias_totales} días
                        </p>

                        {licencia.motivo && (
                          <p className="mt-2">
                            <span className="font-semibold">Motivo:</span> {licencia.motivo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-end gap-3">
                  <span
                    className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${getEstadoBadgeClass(licencia.estado)}`}
                  >
                    {licencia.estado.charAt(0).toUpperCase() + licencia.estado.slice(1)}
                  </span>

                  <div className="flex gap-2">
                    {licencia.ruta_archivo && (
                      <button
                        onClick={() => handleDescargarPdf(licencia.id)}
                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                      >
                        📄 Ver PDF
                      </button>
                    )}

                    {licencia.estado === 'solicitado' && (
                      <button
                        onClick={() => abrirModalEditar(licencia)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                      >
                        ✏️ Editar
                      </button>
                    )}
                  </div>

                  {licencia.estado === 'rechazado' && licencia.motivo_rechazo && (
                    <div className="mt-2 bg-red-50 border border-red-200 rounded p-3 text-sm max-w-md">
                      <p className="font-semibold text-red-800">Motivo del rechazo:</p>
                      <p className="text-red-700">{licencia.motivo_rechazo}</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <h2 className="text-2xl font-bold mb-4">
              {isEditing ? 'Editar Licencia' : 'Solicitar Nueva Licencia'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Licencia *
                  </label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
                    required
                  >
                    <option value="licencia_medica">Licencia Médica</option>
                    <option value="permiso">Permiso</option>
                    <option value="vacaciones">Vacaciones</option>
                    <option value="licencia_maternidad">Licencia Maternidad</option>
                    <option value="licencia_paternidad">Licencia Paternidad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio *
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
                    Fecha de Término *
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📎 Adjuntar Licencia (PDF) {!isEditing && '*'}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-sm"
                      required={!isEditing}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Máximo 5MB - Solo PDF
                    </p>
                  </div>

                  {isEditing && currentLicencia?.nombre_archivo && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ Archivo actual: {currentLicencia.nombre_archivo}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo / Descripción *
                  </label>
                  <textarea
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    placeholder="Ejemplo: Licencia médica por reposo..."
                    required
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
                  {isEditing ? '✏️ Actualizar' : '📤 Enviar'} Solicitud
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default MisLicenciasPage;
