import React, { useState, useEffect } from 'react';
import {
  fetchMisLicencias,
  fetchEmpleados,
  crearLicencia,
  actualizarLicencia,
  descargarPdfLicencia,
} from '../../services/api';
import Header from '../../components/common/Header';
import { 
  FileText, Plus, AlertCircle, CheckCircle, XCircle, Clock, 
  Download, Edit, Calendar, File 
} from 'lucide-react';
import Button from '../../components/common/Button';

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

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const str = String(fecha).slice(0, 10);
    const [y, m, d] = str.split('-');
    if (!y || !m || !d) return fecha;
    return `${d}-${m}-${y}`;
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
      setLicencias(Array.isArray(data) ? data : []);
      const empleadosData = await fetchEmpleados();
      setEmpleados(empleadosData);

      const miEmpleado = empleadosData.find(emp => emp.user_id === currentUser.id);
      if (miEmpleado) {
        setFormData(prev => ({ ...prev, empleado_id: miEmpleado.id }));
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos');
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
    if (licencia.estado !== 'solicitado') return;
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
    setError(null); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const data = new FormData();
      data.append('empleado_id', formData.empleado_id);
      data.append('tipo', formData.tipo);
      data.append('fecha_inicio', formData.fecha_inicio);
      data.append('fecha_termino', formData.fecha_termino);
      data.append('motivo', formData.motivo);
      if (formData.archivo_pdf) data.append('archivo_pdf', formData.archivo_pdf);

      if (isEditing) {
        await actualizarLicencia(currentLicencia.id, data);
        setSuccess('Licencia actualizada correctamente');
      } else {
        await crearLicencia(data);
        setSuccess('Licencia solicitada correctamente');
      }
      cerrarModal();
      cargarDatos();
      setTimeout(() => setSuccess(null), 3000);
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

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'solicitado': 
        return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock size={12}/> Solicitado</span>;
      case 'aprobado': 
        return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle size={12}/> Aprobado</span>;
      case 'rechazado': 
        return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-red-800 flex items-center gap-1"><XCircle size={12}/> Rechazado</span>;
      default: 
        return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-gray-100 text-gray-800">{estado}</span>;
    }
  };

  const getTipoLabel = (tipo) => {
    const labels = {
      licencia_medica: 'Licencia Médica',
      permiso: 'Permiso Administrativo',
      vacaciones: 'Vacaciones',
      licencia_maternidad: 'Licencia Maternidad',
      licencia_paternidad: 'Licencia Paternidad',
    };
    return labels[tipo] || tipo.replace('_', ' ');
  };

  if (loading && licencias.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis Licencias</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Historial y gestión de tus permisos y licencias médicas.</p>
          </div>
          <Button 
            variant="primary" 
            onClick={abrirModalCrear}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-none"
          >
            <Plus size={20} /> Nueva Solicitud
          </Button>
        </div>
        <FileText className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* ALERTAS */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={20} /> {success}
        </div>
      )}

      {/* LISTA DE LICENCIAS */}
      {licencias.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Sin registros</h3>
          <p className="text-slate-500 mb-6">No tienes licencias o permisos registrados actualmente.</p>
          <Button onClick={abrirModalCrear} variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-50">
            Crear primera solicitud
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {licencias.map((lic) => (
            <div key={lic.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg text-slate-800">{getTipoLabel(lic.tipo)}</h3>
                      {getEstadoBadge(lic.estado)}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 mt-2">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                        <span className="font-semibold text-slate-400">Desde:</span> {formatFecha(lic.fecha_inicio)}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                        <span className="font-semibold text-slate-400">Hasta:</span> {formatFecha(lic.fecha_termino)}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                        <Clock size={14} className="text-slate-400"/> {lic.dias_totales} días
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 mt-3 italic bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      "{lic.motivo}"
                    </p>

                    {lic.estado === 'rechazado' && lic.motivo_rechazo && (
                      <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0"/>
                        <div>
                          <span className="font-bold block text-xs uppercase mb-1">Motivo Rechazo:</span>
                          {lic.motivo_rechazo}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                  {lic.ruta_archivo && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDescargarPdf(lic.id)}
                      className="flex-1 md:flex-none justify-center text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Download size={16} className="mr-2"/> PDF
                    </Button>
                  )}
                  
                  {lic.estado === 'solicitado' && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => abrirModalEditar(lic)}
                      className="flex-1 md:flex-none justify-center"
                    >
                      <Edit size={16} className="mr-2"/> Editar
                    </Button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
            
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? 'Editar Solicitud' : 'Nueva Solicitud'}
              </h2>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-full">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tipo de Licencia</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  required
                >
                  <option value="licencia_medica">Licencia Médica</option>
                  <option value="permiso">Permiso Administrativo</option>
                  <option value="vacaciones">Vacaciones</option>
                  <option value="licencia_maternidad">Maternidad</option>
                  <option value="licencia_paternidad">Paternidad</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Inicio</label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Término</label>
                  <input
                    type="date"
                    name="fecha_termino"
                    value={formData.fecha_termino}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Respaldo PDF {!isEditing && <span className="text-red-500">*</span>}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-center group cursor-pointer relative">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required={!isEditing}
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <File className="text-slate-400 group-hover:text-blue-500 transition-colors" size={32} />
                    <p className="text-sm font-medium text-slate-600">
                      {formData.archivo_pdf ? formData.archivo_pdf.name : "Arrastra o selecciona un archivo"}
                    </p>
                    <p className="text-xs text-slate-400">Solo PDF (Máx. 5MB)</p>
                  </div>
                </div>
                {isEditing && currentLicencia?.nombre_archivo && !formData.archivo_pdf && (
                  <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                    <CheckCircle size={12}/> Archivo actual: {currentLicencia.nombre_archivo}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Motivo</label>
                <textarea
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  placeholder="Describe brevemente la razón..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={cerrarModal} className="border-slate-300 text-slate-600">Cancelar</Button>
                <Button variant="primary" type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                  {isEditing ? 'Guardar Cambios' : 'Enviar Solicitud'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MisLicenciasPage;