import React, { useState, useEffect } from 'react';
import { 
  Plus, FileText, Calendar, MapPin, Bus, AlertTriangle, 
  Upload, X, Check, Clock 
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { 
  fetchMisReportes, 
  crearReporte, 
  actualizarReporte, 
  eliminarReporte,
  descargarDocumentoReporte,
  fetchBuses, // Necesario para el selector
  fetchRutas  // Necesario para el selector
} from '../services/api';

const MisReportesPage = ({ user }) => {
  const { addNotification } = useNotifications();
  
  // Estados
  const [reportes, setReportes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    tipo: 'incidente_ruta',
    fecha_incidente: new Date().toISOString().split('T')[0],
    hora_incidente: '',
    titulo: '',
    descripcion: '',
    ubicacion: '',
    bus_id: '',
    ruta_id: '',
    gravedad: 'baja',
    documento: null
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [misReportes, listaBuses, listaRutas] = await Promise.all([
        fetchMisReportes(),
        fetchBuses(), // Asumiendo que existen estos endpoints públicos o de catálogo
        fetchRutas()
      ]);
      setReportes(misReportes);
      setBuses(listaBuses.data || listaBuses); // Ajustar según estructura de respuesta
      setRutas(listaRutas.data || listaRutas);
    } catch (error) {
      console.error(error);
      addNotification('error', 'Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Manejadores del Formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
      addNotification('error', 'Archivo muy grande', 'El máximo es 5MB');
      e.target.value = '';
      return;
    }
    setFormData(prev => ({ ...prev, documento: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Necesitamos el empleado_id del usuario actual
      // Asumimos que user viene como prop o lo sacamos del localStorage
      // NOTA: El backend valida que el empleado corresponda al usuario
      
      // Construir FormData
      const data = new FormData();
      // Si tenemos el empleado_id en el objeto user del prop, lo usamos
      // Si no, deberíamos obtenerlo de una llamada a /me o similar.
      // Por ahora enviamos el ID asumiendo que el backend lo infiere o valida.
      if (user.empleado_id) data.append('empleado_id', user.empleado_id);
      else {
        // Fallback: intentar obtenerlo de localStorage si está guardado
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if (savedUser?.empleado?.id) data.append('empleado_id', savedUser.empleado.id);
      }

      Object.keys(formData).forEach(key => {
        if (key === 'documento' && formData[key]) {
          data.append('documento', formData[key]);
        } else if (formData[key] !== null && formData[key] !== '' && key !== 'documento' && key !== 'id') {
          data.append(key, formData[key]);
        }
      });

      if (isEditing) {
        await actualizarReporte(formData.id, data);
        addNotification('success', 'Actualizado', 'Reporte modificado correctamente');
      } else {
        await crearReporte(data);
        addNotification('success', 'Enviado', 'Reporte creado correctamente');
      }
      
      closeModal();
      cargarDatos();
    } catch (error) {
      addNotification('error', 'Error', error.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este reporte?')) return;
    try {
      await eliminarReporte(id);
      addNotification('success', 'Eliminado', 'Reporte eliminado');
      cargarDatos();
    } catch (error) {
      addNotification('error', 'Error', 'No se pudo eliminar');
    }
  };

  // UI Helpers
  const openNewModal = () => {
    setIsEditing(false);
    setFormData({
      tipo: 'incidente_ruta',
      fecha_incidente: new Date().toISOString().split('T')[0],
      hora_incidente: '',
      titulo: '',
      descripcion: '',
      ubicacion: '',
      bus_id: '',
      ruta_id: '',
      gravedad: 'baja',
      documento: null
    });
    setShowModal(true);
  };

  const openEditModal = (reporte) => {
    if (reporte.estado !== 'pendiente') {
      addNotification('warning', 'No editable', 'Solo puedes editar reportes pendientes');
      return;
    }
    setIsEditing(true);
    setFormData({
      id: reporte.id,
      tipo: reporte.tipo,
      fecha_incidente: reporte.fecha_incidente,
      hora_incidente: reporte.hora_incidente || '',
      titulo: reporte.titulo,
      descripcion: reporte.descripcion,
      ubicacion: reporte.ubicacion || '',
      bus_id: reporte.bus_id || '',
      ruta_id: reporte.ruta_id || '',
      gravedad: reporte.gravedad || 'baja',
      documento: null
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'aprobado': return 'bg-green-100 text-green-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Reportes</h1>
          <p className="text-gray-500">Historial de incidencias y solicitudes</p>
        </div>
        <button 
          onClick={openNewModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} /> Nuevo Reporte
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportes.map((reporte) => (
            <div key={reporte.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition p-5 relative group">
              
              {/* Badge Estado */}
              <div className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(reporte.estado)}`}>
                {reporte.estado}
              </div>

              {/* Título y Tipo */}
              <div className="mb-3 pr-16">
                <h3 className="font-bold text-gray-800 truncate" title={reporte.titulo}>{reporte.titulo}</h3>
                <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                  {reporte.tipo.replace('_', ' ')}
                </span>
              </div>

              {/* Info Detallada */}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{new Date(reporte.fecha_incidente).toLocaleDateString()}</span>
                  {reporte.hora_incidente && <span>{reporte.hora_incidente.substring(0,5)} hrs</span>}
                </div>
                
                {reporte.bus && (
                  <div className="flex items-center gap-2">
                    <Bus size={16} className="text-gray-400" />
                    <span>Bus: {reporte.bus.patente}</span>
                  </div>
                )}
                
                {reporte.ubicacion && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="truncate">{reporte.ubicacion}</span>
                  </div>
                )}
              </div>

              {/* Footer Acciones */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                {reporte.ruta_documento ? (
                   <button 
                    onClick={() => descargarDocumentoReporte(reporte.id)}
                    className="text-blue-600 text-xs flex items-center gap-1 hover:underline"
                   >
                     <FileText size={14} /> Ver Adjunto
                   </button>
                ) : <span className="text-xs text-gray-400">Sin adjunto</span>}

                <div className="flex gap-2">
                  {reporte.estado === 'pendiente' && (
                    <>
                      <button onClick={() => openEditModal(reporte)} className="text-gray-500 hover:text-blue-600">Editar</button>
                      <button onClick={() => handleDelete(reporte.id)} className="text-gray-500 hover:text-red-600">Borrar</button>
                    </>
                  )}
                  {reporte.estado !== 'pendiente' && (
                    <span className="text-xs text-gray-400 italic">Cerrado</span>
                  )}
                </div>
              </div>
              
              {/* Motivo Rechazo */}
              {reporte.estado === 'rechazado' && reporte.observaciones_revision && (
                <div className="mt-3 bg-red-50 p-2 rounded text-xs text-red-700">
                  <strong>Rechazo:</strong> {reporte.observaciones_revision}
                </div>
              )}
            </div>
          ))}
          
          {reportes.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No tienes reportes registrados.
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR/EDITAR */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">{isEditing ? 'Editar Reporte' : 'Nuevo Reporte'}</h2>
              <button onClick={closeModal}><X size={24} className="text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tipo y Gravedad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte *</label>
                  <select name="tipo" required className="w-full border rounded-lg p-2" value={formData.tipo} onChange={handleInputChange}>
                    <option value="ausencia_enfermedad">Ausencia (Enfermedad)</option>
                    <option value="ausencia_personal">Ausencia (Personal)</option>
                    <option value="incidente_ruta">Incidente en Ruta</option>
                    <option value="problema_mecanico">Problema Mecánico</option>
                    <option value="accidente_transito">Accidente de Tránsito</option>
                    <option value="queja_pasajero">Queja de Pasajero</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gravedad</label>
                  <select name="gravedad" className="w-full border rounded-lg p-2" value={formData.gravedad} onChange={handleInputChange}>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título / Asunto *</label>
                <input 
                  type="text" 
                  name="titulo" 
                  required 
                  className="w-full border rounded-lg p-2" 
                  placeholder="Ej: Falla en motor, Licencia médica, etc."
                  value={formData.titulo}
                  onChange={handleInputChange}
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Incidente *</label>
                  <input type="date" name="fecha_incidente" required className="w-full border rounded-lg p-2" value={formData.fecha_incidente} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora (Opcional)</label>
                  <input type="time" name="hora_incidente" className="w-full border rounded-lg p-2" value={formData.hora_incidente} onChange={handleInputChange} />
                </div>
              </div>

              {/* Contexto Operativo (Opcional) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Bus (Opcional)</label>
                   <select name="bus_id" className="w-full border rounded-lg p-2" value={formData.bus_id} onChange={handleInputChange}>
                     <option value="">-- Seleccionar --</option>
                     {buses.map(b => <option key={b.id} value={b.id}>{b.patente} - {b.modelo}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Ruta (Opcional)</label>
                   <select name="ruta_id" className="w-full border rounded-lg p-2" value={formData.ruta_id} onChange={handleInputChange}>
                     <option value="">-- Seleccionar --</option>
                     {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación (Opcional)</label>
                <input 
                  type="text" 
                  name="ubicacion" 
                  className="w-full border rounded-lg p-2" 
                  placeholder="Ej: Av. Principal con Calle 2"
                  value={formData.ubicacion}
                  onChange={handleInputChange}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Detallada *</label>
                <textarea 
                  name="descripcion" 
                  required 
                  rows="4" 
                  className="w-full border rounded-lg p-2" 
                  placeholder="Describe qué sucedió..."
                  value={formData.descripcion}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              {/* Archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntar Evidencia (PDF/Foto) - Máx 5MB</label>
                <div className="border border-dashed border-gray-300 p-4 rounded-lg bg-gray-50 text-center cursor-pointer hover:bg-gray-100 transition relative">
                   <input type="file" name="documento" accept=".pdf,.jpg,.png,.jpeg" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   <div className="flex flex-col items-center pointer-events-none">
                     <Upload size={24} className="text-gray-400 mb-2" />
                     {formData.documento ? (
                       <span className="text-blue-600 font-medium">{formData.documento.name}</span>
                     ) : (
                       <span className="text-gray-500 text-sm">Arrastra un archivo o haz clic aquí</span>
                     )}
                   </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar Reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisReportesPage;