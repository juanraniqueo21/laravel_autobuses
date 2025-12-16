import React, { useState, useEffect } from 'react';
import { 
  Plus, ChevronDown, ChevronUp, AlertCircle, Search, X, 
  Edit2, Trash2, User, FileText 
} from 'lucide-react';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchConductores, fetchEmpleados, createConductor, updateConductor, deleteConductor } from '../services/api';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/common/Pagination'; // Asegúrate de importar el componente de paginación
import { useNotifications } from '../context/NotificationContext';

const CLASES_LICENCIA = ['A', 'A2', 'A3', 'B', 'C', 'D', 'E'];
const ESTADOS = ['activo', 'baja_medica', 'suspendido', 'inactivo'];

// ==========================================
// UTILIDADES DE FECHAS Y SEMÁFORO
// ==========================================

// 1. Formatear fecha (Corrige error de zona horaria)
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
};

const formatRUT = (rut, verificador) => {
  if (!rut) return '-';
  return `${new Intl.NumberFormat('es-CL').format(rut)}-${verificador}`;
};

// 2. Semáforo de Vencimientos
const getExpirationStyle = (dateString) => {
  if (!dateString) return 'text-gray-600';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parseo manual YYYY-MM-DD para evitar UTC
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded border border-red-200'; // Vencido
  if (diffDays <= 10) return 'text-red-600 font-bold animate-pulse'; // Crítico (<= 10 días)
  if (diffDays <= 20) return 'text-amber-500 font-bold'; // Advertencia (11-20 días)
  
  return 'text-emerald-600 font-medium'; // OK (> 20 días)
};

export default function ConductoresPage() {
  // --- ESTADOS DE DATOS ---
  const [conductores, setConductores] = useState([]);
  const [empleados, setEmpleados] = useState([]);
   
  // --- ESTADOS DE UI ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingConductor, setEditingConductor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- HOOK DE NOTIFICACIONES ---
  const { addNotification } = useNotifications();

  // --- FORMULARIO ---
  const [formData, setFormData] = useState({
    empleado_id: '',
    numero_licencia: '',
    clase_licencia: 'E',
    fecha_vencimiento_licencia: '',
    fecha_primera_licencia: '',
    estado: 'activo',
    anios_experiencia: 0,
    estado_licencia: 'vigente',
    observaciones_licencia: '',
    cantidad_infracciones: 0,
    cantidad_accidentes: 0,
    historial_sanciones: '',
    fecha_examen_ocupacional: '',
    apto_conducir: true,
    certificado_rcp: false,
    vencimiento_rcp: '',
    certificado_defensa: false,
    vencimiento_defensa: '',
  });

  // --- HELPERS ---
  const getNombreEmpleado = (empleadoId) => {
    const empleado = empleados.find(e => e.id === parseInt(empleadoId));
    if (empleado?.user) {
      return `${empleado.user.nombre} ${empleado.user.apellido}`;
    }
    return 'N/A';
  };

  const getRutEmpleado = (empleadoId) => {
    const empleado = empleados.find(e => e.id === empleadoId);
    if (empleado?.user) {
      return formatRUT(empleado.user.rut, empleado.user.rut_verificador);
    }
    return '';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'activo': 'bg-green-100 text-green-800',
      'licencia_medica': 'bg-blue-100 text-blue-800',
      'suspendido': 'bg-orange-100 text-orange-800',
      'inactivo': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEmpleadosDisponibles = () => {
    return empleados.filter(empleado => {
      if (empleado.estado !== 'activo') return false;
      // Asumiendo rol 3 es conductor
      if (empleado.user?.rol_id !== 3) return false;
      
      const yaEsConductorActivo = conductores.some(
        c => c.empleado_id === empleado.id && c.estado === 'activo'
      );

      if (editingConductor && empleado.id === editingConductor.empleado_id) return true;
      return !yaEsConductorActivo;
    });
  };

  // --- CARGA INICIAL ---
  useEffect(() => {
    loadConductores();
  }, []);

  const loadConductores = async () => {
    try {
      setLoading(true);
      const [conductoresData, empleadosData] = await Promise.all([
        fetchConductores(),
        fetchEmpleados(''), 
      ]);
      setConductores(conductoresData);
      setEmpleados(empleadosData);
      setError(null);
    } catch (err) {
      setError('Error al cargar conductores: ' + err.message);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de los conductores.');
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  const getFilteredData = () => {
    const sortedData = [...conductores].sort((a, b) => b.id - a.id);

    if (!searchTerm.trim()) return sortedData;

    const term = searchTerm.toLowerCase();
    return sortedData.filter(c => {
      const nombre = getNombreEmpleado(c.empleado_id).toLowerCase();
      const rut = getRutEmpleado(c.empleado_id).toLowerCase();
      const rutSinPuntos = rut.replace(/\./g, '');
      const licencia = c.numero_licencia ? c.numero_licencia.toLowerCase() : '';
      const estado = c.estado.toLowerCase();
      
      return nombre.includes(term) || 
             rut.includes(term) || 
             rutSinPuntos.includes(term) || 
             licencia.includes(term) || 
             estado.includes(term);
    });
  };

  const filteredConductores = getFilteredData();
  // Aquí aplicamos la paginación de 10 ítems
  const { currentPage, setCurrentPage, totalPages, paginatedData } = usePagination(filteredConductores, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // --- HANDLERS ---
  const handleOpenDialog = (conductor = null) => {
    if (conductor) {
      setEditingConductor(conductor);
      setFormData({
        ...conductor,
        empleado_id: conductor.empleado_id || '',
        // Asegurar formatos de fecha para inputs (YYYY-MM-DD)
        fecha_vencimiento_licencia: conductor.fecha_vencimiento_licencia ? conductor.fecha_vencimiento_licencia.split('T')[0] : '',
        fecha_primera_licencia: conductor.fecha_primera_licencia ? conductor.fecha_primera_licencia.split('T')[0] : '',
        fecha_examen_ocupacional: conductor.fecha_examen_ocupacional ? conductor.fecha_examen_ocupacional.split('T')[0] : '',
        vencimiento_rcp: conductor.vencimiento_rcp ? conductor.vencimiento_rcp.split('T')[0] : '',
        vencimiento_defensa: conductor.vencimiento_defensa ? conductor.vencimiento_defensa.split('T')[0] : '',
        // Asegurar booleanos
        apto_conducir: conductor.apto_conducir !== undefined ? !!conductor.apto_conducir : true,
        certificado_rcp: conductor.certificado_rcp !== undefined ? !!conductor.certificado_rcp : false,
        certificado_defensa: conductor.certificado_defensa !== undefined ? !!conductor.certificado_defensa : false,
      });
    } else {
      setEditingConductor(null);
      setFormData({
        empleado_id: '',
        numero_licencia: '',
        clase_licencia: 'E',
        fecha_vencimiento_licencia: '',
        fecha_primera_licencia: '',
        estado: 'activo',
        anios_experiencia: 0,
        estado_licencia: 'vigente',
        observaciones_licencia: '',
        cantidad_infracciones: 0,
        cantidad_accidentes: 0,
        historial_sanciones: '',
        fecha_examen_ocupacional: '',
        apto_conducir: true,
        certificado_rcp: false,
        vencimiento_rcp: '',
        certificado_defensa: false,
        vencimiento_defensa: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingConductor(null);
  };

  const handleSave = async () => {
    try {
      if (editingConductor) {
        await updateConductor(editingConductor.id, formData);
        const nombre = getNombreEmpleado(formData.empleado_id);
        addNotification('success', 'Conductor Actualizado', `Los datos del conductor ${nombre} han sido actualizados.`);
      } else {
        await createConductor(formData);
        addNotification('success', 'Nuevo Conductor', 'El conductor ha sido registrado exitosamente.');
      }
      loadConductores();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      addNotification('error', 'Error', 'No se pudieron guardar los datos del conductor.');
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este conductor?')) {
      try {
        await deleteConductor(id);
        addNotification('warning', 'Conductor Eliminado', 'El registro ha sido eliminado del sistema.');
        loadConductores();
        setError(null);
      } catch (err) {
        addNotification('error', 'Error', 'No se pudo eliminar el conductor.');
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // --- RENDERIZADO DE TABLA ---
  const renderConductoresTable = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Conductor</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Licencia</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Clase</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Vencimiento</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Exp.</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No se encontraron conductores</td></tr>
            ) : (
              paginatedData.map((conductor) => (
                <React.Fragment key={conductor.id}>
                  <tr 
                    className="hover:bg-gray-100 transition-colors even:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === conductor.id ? null : conductor.id)}
                  >
                    {/* NOMBRE Y RUT */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getNombreEmpleado(conductor.empleado_id)}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 font-mono">
                        {getRutEmpleado(conductor.empleado_id)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {conductor.numero_licencia}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap font-bold">
                      {conductor.clase_licencia}
                    </td>
                    
                    {/* COLUMNA DE VENCIMIENTO CON SEMÁFORO */}
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <div className={`flex items-center gap-1 ${getExpirationStyle(conductor.fecha_vencimiento_licencia)}`}>
                        {formatDate(conductor.fecha_vencimiento_licencia)}
                        {(getExpirationStyle(conductor.fecha_vencimiento_licencia).includes('red') || getExpirationStyle(conductor.fecha_vencimiento_licencia).includes('amber')) && <AlertCircle size={16}/>}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {conductor.anios_experiencia} años
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoColor(conductor.estado)}`}>
                        {conductor.estado}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenDialog(conductor)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors font-medium"
                          title="Editar"
                        >
                          <Edit2 size={16} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(conductor.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors font-medium"
                          title="Eliminar"
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                        <button
                          onClick={() => setExpandedRow(expandedRow === conductor.id ? null : conductor.id)}
                          className="flex items-center justify-center w-9 h-9 bg-gray-100 text-gray-600 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors ml-1"
                        >
                          {expandedRow === conductor.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedRow === conductor.id && (
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td colSpan="7" className="px-6 py-6 cursor-default">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                          
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2"><FileText size={16}/> Detalle Licencia</h4>
                            <p><span className="text-gray-500">N° Licencia:</span> {conductor.numero_licencia}</p>
                            <p><span className="text-gray-500">Clase:</span> {conductor.clase_licencia}</p>
                            <p><span className="text-gray-500">Emisión:</span> {formatDate(conductor.fecha_primera_licencia)}</p>
                            <p className="flex justify-between">
                                <span className="text-gray-500">Vencimiento:</span> 
                                <span className={getExpirationStyle(conductor.fecha_vencimiento_licencia)}>
                                    {formatDate(conductor.fecha_vencimiento_licencia)}
                                </span>
                            </p>
                            <p className="text-xs text-gray-400 italic mt-1">Obs: {conductor.observaciones_licencia || 'Sin observaciones'}</p>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2"><AlertCircle size={16}/> Historial</h4>
                            <p><span className="text-gray-500">Experiencia:</span> {conductor.anios_experiencia} años</p>
                            <p><span className="text-gray-500">Infracciones:</span> <span className={conductor.cantidad_infracciones > 0 ? 'text-red-600 font-bold' : ''}>{conductor.cantidad_infracciones}</span></p>
                            <p><span className="text-gray-500">Accidentes:</span> <span className={conductor.cantidad_accidentes > 0 ? 'text-red-600 font-bold' : ''}>{conductor.cantidad_accidentes}</span></p>
                            <p className="text-xs text-gray-400 mt-1">{conductor.historial_sanciones || 'Sin sanciones registradas'}</p>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2"><User size={16}/> Salud & Certs</h4>
                            <p><span className="text-gray-500">Examen Ocupacional:</span> {formatDate(conductor.fecha_examen_ocupacional)}</p>
                            <p><span className="text-gray-500">Apto Conducir:</span> {conductor.apto_conducir ? ' SÍ' : ' NO'}</p>
                            <p><span className="text-gray-500">RCP:</span> {conductor.certificado_rcp ? ' Vigente' : ' Pendiente'}</p>
                            <p><span className="text-gray-500">Manejo Defensivo:</span> {conductor.certificado_defensa ? ' Vigente' : ' Pendiente'}</p>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER CARD NUEVO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Conductores</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Administra los conductores de la empresa.</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Nuevo Conductor
          </Button>
        </div>
        <User className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* BUSCADOR UNIFICADO */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o número de licencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchTerm && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : conductores.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No hay conductores registrados</div>
      ) : (
        renderConductoresTable()
      )}

      {/* PAGINACIÓN COMPONENTE */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingConductor ? 'Editar Conductor' : 'Nuevo Conductor'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        {/* SECCIÓN 1: DATOS BÁSICOS */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Básicos</h3>
          
          <Select
            label="Empleado"
            options={[
              { id: '', label: 'Seleccione un empleado' },
              ...getEmpleadosDisponibles().map(emp => ({
                id: emp.id,
                label: `${emp.user?.nombre} ${emp.user?.apellido} - ${emp.numero_empleado}`
              }))
            ]}
            value={formData.empleado_id}
            onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Número de Licencia"
              value={formData.numero_licencia}
              onChange={(e) => setFormData({ ...formData, numero_licencia: e.target.value })}
              required
            />
            <Select
              label="Clase de Licencia"
              options={CLASES_LICENCIA.map(c => ({ id: c, label: c }))}
              value={formData.clase_licencia}
              onChange={(e) => setFormData({ ...formData, clase_licencia: e.target.value })}
              required
            />
          </div>
        </div>

        {/* SECCIÓN 2: LICENCIA */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Licencia</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Emisión"
              type="date"
              value={formData.fecha_primera_licencia}
              onChange={(e) => setFormData({ ...formData, fecha_primera_licencia: e.target.value })}
              required
            />
            <Input
              label="Fecha de Vencimiento"
              type="date"
              value={formData.fecha_vencimiento_licencia}
              onChange={(e) => setFormData({ ...formData, fecha_vencimiento_licencia: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Select
              label="Estado de Licencia"
              options={[
                { id: 'vigente', label: 'Vigente' },
                { id: 'vencida', label: 'Vencida' },
                { id: 'suspendida', label: 'Suspendida' },
              ]}
              value={formData.estado_licencia}
              onChange={(e) => setFormData({ ...formData, estado_licencia: e.target.value })}
              required
            />
            <Input
              label="Observaciones (Códigos VÍA)"
              value={formData.observaciones_licencia}
              onChange={(e) => setFormData({ ...formData, observaciones_licencia: e.target.value })}
              placeholder="Ej: 01 (gafas), 02 (solo día)"
            />
          </div>
        </div>

        {/* SECCIÓN 3: EXPERIENCIA */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Experiencia & Sanciones</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Años de Experiencia"
              type="number"
              value={formData.anios_experiencia}
              onChange={(e) => setFormData({ ...formData, anios_experiencia: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Cantidad de Infracciones"
              type="number"
              value={formData.cantidad_infracciones}
              onChange={(e) => setFormData({ ...formData, cantidad_infracciones: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Cantidad de Accidentes"
              type="number"
              value={formData.cantidad_accidentes}
              onChange={(e) => setFormData({ ...formData, cantidad_accidentes: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Historial de Sanciones"
              value={formData.historial_sanciones}
              onChange={(e) => setFormData({ ...formData, historial_sanciones: e.target.value })}
              placeholder="Descripción de sanciones o antecedentes"
            />
          </div>
        </div>

        {/* SECCIÓN 4: SALUD */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Salud & Aptitud</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha Examen Ocupacional"
              type="date"
              value={formData.fecha_examen_ocupacional}
              onChange={(e) => setFormData({ ...formData, fecha_examen_ocupacional: e.target.value })}
            />
          </div>

          <div className="space-y-3 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.apto_conducir}
                onChange={(e) => setFormData({ ...formData, apto_conducir: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Apto para Conducir</span>
            </label>
          </div>
        </div>

        {/* SECCIÓN 5: CERTIFICADOS */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificados</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.certificado_rcp}
                onChange={(e) => setFormData({ ...formData, certificado_rcp: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Certificado RCP</span>
            </label>

            {formData.certificado_rcp && (
              <Input
                label="Vencimiento RCP"
                type="date"
                value={formData.vencimiento_rcp}
                onChange={(e) => setFormData({ ...formData, vencimiento_rcp: e.target.value })}
              />
            )}
          </div>

          <div className="space-y-3 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.certificado_defensa}
                onChange={(e) => setFormData({ ...formData, certificado_defensa: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Certificado Defensa</span>
            </label>

            {formData.certificado_defensa && (
              <Input
                label="Vencimiento Defensa"
                type="date"
                value={formData.vencimiento_defensa}
                onChange={(e) => setFormData({ ...formData, vencimiento_defensa: e.target.value })}
              />
            )}
          </div>
        </div>

        {/* SECCIÓN 6: ESTADO */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado</h3>
          
          <Select
            label="Estado del Conductor"
            options={ESTADOS.map(e => ({ id: e, label: e }))}
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            required
          />
        </div>
      </FormDialog>
    </div>
  );
}