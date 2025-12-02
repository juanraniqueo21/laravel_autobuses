import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Plus, Filter, Search, Check, X, 
  Trash2, Edit2, Download, AlertCircle 
} from 'lucide-react';
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

import Table from '../components/tables/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import FormDialog from '../components/forms/FormDialog';

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
  const [filtroEmpleado, setFiltroEmpleado] = useState(''); // Ahora almacenará el texto de búsqueda
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

  // --- HELPERS PARA DATOS ---
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

  // --- LÓGICA DE FILTROS ACTUALIZADA ---
  const aplicarFiltros = () => {
    let resultado = [...licencias];

    // MODIFICADO: Ahora filtra por coincidencia de texto (nombre o RUT)
    if (filtroEmpleado) {
      const termino = filtroEmpleado.toLowerCase();
      resultado = resultado.filter((l) => {
        const nombre = getEmpleadoNombre(l.empleado_id).toLowerCase();
        const rut = getEmpleadoRut(l.empleado_id).toLowerCase();
        return nombre.includes(termino) || rut.includes(termino);
      });
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

  // --- MANEJADORES DE FORMULARIOS Y ACCIONES ---
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

  const handleRechazar = async (e) => {
    if(e) e.preventDefault();
    
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

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'solicitado': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aprobado': return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazado': return 'bg-red-100 text-red-800 border-red-200';
      case 'completado': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Definición de columnas para la tabla reutilizable
  const columns = useMemo(() => [
    {
      label: 'Empleado',
      key: 'empleado',
      render: (licencia) => (
        <div>
          <div className="font-semibold text-gray-900">{getEmpleadoNombre(licencia.empleado_id)}</div>
          <div className="text-xs text-gray-500 font-mono">{getEmpleadoRut(licencia.empleado_id)}</div>
        </div>
      )
    },
    {
      label: 'Tipo',
      key: 'tipo',
      render: (licencia) => (
        <span className="capitalize text-sm text-gray-700">{getTipoLabel(licencia.tipo)}</span>
      )
    },
    {
      label: 'Inicio',
      key: 'fecha_inicio',
      render: (licencia) => formatDate(licencia.fecha_inicio)
    },
    {
      label: 'Término',
      key: 'fecha_termino',
      render: (licencia) => formatDate(licencia.fecha_termino)
    },
    {
      label: 'Días',
      key: 'dias_totales',
      render: (licencia) => <span className="font-mono">{licencia.dias_totales}</span>
    },
    {
      label: 'Estado',
      key: 'estado',
      render: (licencia) => (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${getEstadoBadgeClass(licencia.estado || '')}`}>
          {licencia.estado || 'Sin estado'}
        </span>
      )
    },
    {
      label: 'PDF',
      key: 'pdf',
      render: (licencia) => licencia.ruta_archivo ? (
        <button
          onClick={() => handleDescargarPdf(licencia.id)}
          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
          title="Descargar PDF"
        >
          <Download size={18} />
        </button>
      ) : <span className="text-gray-300">-</span>
    },
    {
      label: 'Acciones',
      key: 'acciones',
      render: (licencia) => (
        <div className="flex gap-1 justify-center">
          {(!licencia.estado || licencia.estado === 'solicitado') && (
            <>
              <button
                onClick={() => abrirModalEditar(licencia)}
                className="p-1.5 text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                title="Editar"
              >
                <Edit2 size={16} />
              </button>

              {puedeAprobarRechazar() && (
                <>
                  <button
                    onClick={() => handleAprobar(licencia.id)}
                    className="p-1.5 text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                    title="Aprobar"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => abrirModalRechazar(licencia)}
                    className="p-1.5 text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                    title="Rechazar"
                  >
                    <X size={16} />
                  </button>
                </>
              )}
            </>
          )}

          {puedeEliminar() && (
            <button
              onClick={() => handleEliminar(licencia.id)}
              className="p-1.5 text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ], [empleados, currentUser]); 

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      {/* Header con estilo de proyecto */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Licencias</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Administra las solicitudes de licencias médicas, permisos y vacaciones.</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={abrirModalCrear}
            className="flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Nueva Solicitud
          </Button>
        </div>
        <FileText className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Mensajes de feedback */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <Check size={20} />
          <span>{success}</span>
        </div>
      )}

      {/* Filtros en tarjeta blanca */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* MODIFICADO: Input de búsqueda en lugar de Select */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Buscar Empleado</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Nombre o RUT..."
                  value={filtroEmpleado}
                  onChange={(e) => setFiltroEmpleado(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {filtroEmpleado && (
                   <button 
                     onClick={() => setFiltroEmpleado('')}
                     className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                   >
                     <X size={14} />
                   </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700 cursor-pointer"
              >
                <option value="">Todos</option>
                <option value="solicitado">Solicitado</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="completado">Completado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700 cursor-pointer"
              >
                <option value="">Todos</option>
                <option value="licencia_medica">Licencia Médica</option>
                <option value="permiso">Permiso</option>
                <option value="vacaciones">Vacaciones</option>
                <option value="licencia_maternidad">Licencia Maternidad</option>
                <option value="licencia_paternidad">Licencia Paternidad</option>
              </select>
            </div>

            <div className="flex items-end">
              {(filtroEmpleado || filtroEstado || filtroTipo) && (
                <button
                  onClick={limpiarFiltros}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg transition-colors text-sm font-medium h-[38px]"
                >
                  <Filter size={16} />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla reutilizable */}
      <Table 
        columns={columns} 
        data={licenciasFiltradas} 
        loading={loading}
        emptyMessage="No se encontraron licencias con los filtros seleccionados"
      />

      {/* Modal Crear/Editar usando FormDialog */}
      <FormDialog
        isOpen={showModal}
        title={isEditing ? 'Editar Licencia' : 'Nueva Licencia'}
        onSubmit={handleSubmit}
        onCancel={cerrarModal}
        onClose={cerrarModal}
      >
        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Empleado *"
            value={formData.empleado_id}
            onChange={handleInputChange}
            name="empleado_id"
            options={empleados
              .filter((emp) => emp.estado === 'activo')
              .map((emp) => ({
                id: emp.id,
                label: `${getEmpleadoNombre(emp.id)} (${getEmpleadoRut(emp.id)})`
              }))}
            required
            disabled={isEditing}
          />

          <Select
            label="Tipo *"
            value={formData.tipo}
            onChange={handleInputChange}
            name="tipo"
            options={[
              { id: 'licencia_medica', label: 'Licencia Médica' },
              { id: 'permiso', label: 'Permiso' },
              { id: 'vacaciones', label: 'Vacaciones' },
              { id: 'licencia_maternidad', label: 'Licencia Maternidad' },
              { id: 'licencia_paternidad', label: 'Licencia Paternidad' },
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Fecha Inicio *" 
              type="date" 
              name="fecha_inicio"
              value={formData.fecha_inicio} 
              onChange={handleInputChange} 
              required 
            />
            <Input 
              label="Fecha Término *" 
              type="date" 
              name="fecha_termino"
              value={formData.fecha_termino} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Archivo PDF {!isEditing && '*'}</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required={!isEditing}
            />
            {isEditing && currentLicencia?.nombre_archivo && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Check size={12}/> Archivo actual: {currentLicencia.nombre_archivo}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea
              name="motivo"
              value={formData.motivo}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Motivo de la licencia..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>
      </FormDialog>

      {/* Modal Rechazar usando FormDialog */}
      <FormDialog
        isOpen={showRechazarModal}
        title="Rechazar Licencia"
        onSubmit={handleRechazar}
        onCancel={cerrarModalRechazar}
        onClose={cerrarModalRechazar}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo del rechazo *
          </label>
          <textarea
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Explique el motivo del rechazo (mínimo 10 caracteres)..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">Mínimo 10 caracteres</p>
        </div>
        
        {/* Footer personalizado para rechazo */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100"></div>
      </FormDialog>
    </div>
  );
};

export default LicenciasPage;