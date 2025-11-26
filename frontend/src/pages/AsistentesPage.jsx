import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, X, Edit2, Trash2, ChevronDown, ChevronUp, 
  User, Calendar, FileText, Phone, Mail, MapPin 
} from 'lucide-react';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchAsistentes, fetchEmpleados, createAsistente, updateAsistente, deleteAsistente } from '../services/api';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/common/Pagination'; // IMPORTAR COMPONENTE
import { useNotifications } from '../context/NotificationContext'; 

const ESTADOS_ASISTENTE = ['activo', 'inactivo', 'licencia_medica', 'suspendido'];

// ==========================================
// UTILIDADES
// ==========================================
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-CL');
};

const formatRUT = (rut, verificador) => {
  if (!rut) return '-';
  return `${new Intl.NumberFormat('es-CL').format(rut)}-${verificador}`;
};

export default function AsistentesPage() {
  // --- ESTADOS ---
  const [asistentes, setAsistentes] = useState([]);
  const [filteredAsistentes, setFilteredAsistentes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAsistente, setEditingAsistente] = useState(null);
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  // --- HOOK DE NOTIFICACIONES ---
  const { addNotification } = useNotifications();

  const [formData, setFormData] = useState({
    empleado_id: '',
    fecha_inicio: '',
    fecha_termino: '',
    fecha_examen_ocupacional: '',
    estado: 'activo',
    observaciones: '',
  });

  // --- EFECTOS ---
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Lógica de filtrado
    if (!searchTerm) {
      setFilteredAsistentes(asistentes);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = asistentes.filter(a => {
        const emp = getFullEmpleadoInfo(a.empleado_id);
        const nombre = emp ? `${emp.user?.nombre} ${emp.user?.apellido}`.toLowerCase() : '';
        const rut = emp ? `${emp.user?.rut}` : '';
        const email = emp ? emp.user?.email.toLowerCase() : '';
        
        return nombre.includes(term) || rut.includes(term) || email.includes(term);
      });
      setFilteredAsistentes(filtered);
    }
  }, [asistentes, searchTerm, empleados]);

  // Configuración de paginación
  // Ordenamos por ID descendente (más recientes primero) antes de paginar
  const sortedData = [...filteredAsistentes].sort((a, b) => b.id - a.id);
  const { currentPage, setCurrentPage, totalPages, paginatedData } = usePagination(sortedData, 10);

  // Resetear página al buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);


  const loadData = async () => {
    try {
      setLoading(true);
      const [asistentesData, empleadosData] = await Promise.all([
        fetchAsistentes(),
        fetchEmpleados(),
      ]);
      setAsistentes(asistentesData);
      setEmpleados(empleadosData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de los asistentes.');
    } finally {
      setLoading(false);
    }
  };

  // --- HELPERS ---
  const getFullEmpleadoInfo = (empleadoId) => {
    return empleados.find(e => e.id === parseInt(empleadoId)) || 
           asistentes.find(a => a.empleado_id === empleadoId)?.empleado;
  };

  const getEmpleadoNombre = (empleadoId) => {
    const emp = getFullEmpleadoInfo(empleadoId);
    return emp ? `${emp.user?.nombre || ''} ${emp.user?.apellido || ''}`.trim() : 'N/A';
  };

  const getEmpleadoRUT = (empleadoId) => {
    const emp = getFullEmpleadoInfo(empleadoId);
    return emp ? formatRUT(emp.user?.rut, emp.user?.rut_verificador) : '-';
  };

  const getEmpleadoEmail = (empleadoId) => {
    const emp = getFullEmpleadoInfo(empleadoId);
    return emp?.user?.email || 'Sin email';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'activo': 'bg-green-100 text-green-800',
      'inactivo': 'bg-orange-100 text-orange-800',
      'licencia_medica': 'bg-blue-100 text-blue-800',
      'suspendido': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEmpleadosDisponibles = () => {
    return empleados.filter(empleado => {
      if (empleado.estado !== 'activo') return false;
      // Asumiendo rol 5 es asistente (Ajustar según tu BD si es necesario)
      if (empleado.user?.rol_id !== 5) return false; 
      
      const yaEsAsistente = asistentes.some(
        a => a.empleado_id === empleado.id && a.estado === 'activo'
      );
      
      if (editingAsistente && empleado.id === editingAsistente.empleado_id) return true;
      
      return !yaEsAsistente;
    });
  };

  // --- HANDLERS ---
  const handleOpenDialog = (asistente = null) => {
    if (asistente) {
      setEditingAsistente(asistente);
      setFormData({
        empleado_id: asistente.empleado_id,
        fecha_inicio: asistente.fecha_inicio ? asistente.fecha_inicio.split('T')[0] : '',
        fecha_termino: asistente.fecha_termino ? asistente.fecha_termino.split('T')[0] : '',
        fecha_examen_ocupacional: asistente.fecha_examen_ocupacional ? asistente.fecha_examen_ocupacional.split('T')[0] : '',
        estado: asistente.estado || 'activo',
        observaciones: asistente.observaciones || '',
      });
    } else {
      setEditingAsistente(null);
      setFormData({
        empleado_id: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_termino: '',
        fecha_examen_ocupacional: '',
        estado: 'activo',
        observaciones: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAsistente(null);
  };

  const handleSave = async () => {
    try {
      if (editingAsistente) {
        await updateAsistente(editingAsistente.id, formData);
        const nombre = getEmpleadoNombre(formData.empleado_id);
        addNotification('success', 'Asistente Actualizado', `Los datos de ${nombre} han sido actualizados.`);
      } else {
        await createAsistente(formData);
        addNotification('success', 'Nuevo Asistente', 'El asistente ha sido registrado exitosamente.');
      }
      loadData();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      addNotification('error', 'Error', 'No se pudieron guardar los datos.');
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este asistente?')) {
      try {
        await deleteAsistente(id);
        addNotification('warning', 'Asistente Eliminado', 'El registro ha sido eliminado del sistema.');
        loadData();
        setError(null);
      } catch (err) {
        addNotification('error', 'Error', 'No se pudo eliminar el asistente.');
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // --- RENDERIZADO DE TABLA ---
  const renderAsistentesTable = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Asistente</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">RUT</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Inicio</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No se encontraron asistentes</td></tr>
            ) : (
              paginatedData.map((asistente) => (
                <React.Fragment key={asistente.id}>
                  <tr 
                    className="hover:bg-gray-100 transition-colors even:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === asistente.id ? null : asistente.id)}
                  >
                    {/* Columna Asistente */}
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                      {getEmpleadoNombre(asistente.empleado_id)}
                    </td>

                    {/* Columna RUT (Heredado) */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap font-mono">
                      {getEmpleadoRUT(asistente.empleado_id)}
                    </td>

                    {/* Columna Email (Heredado) */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        {getEmpleadoEmail(asistente.empleado_id)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(asistente.fecha_inicio)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoColor(asistente.estado)}`}>
                        {asistente.estado}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenDialog(asistente)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors font-medium"
                          title="Editar"
                        >
                          <Edit2 size={16} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(asistente.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors font-medium"
                          title="Eliminar"
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                        <button
                          onClick={() => setExpandedRow(expandedRow === asistente.id ? null : asistente.id)}
                          className="flex items-center justify-center w-9 h-9 bg-gray-100 text-gray-600 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors ml-1"
                        >
                          {expandedRow === asistente.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* FILA EXPANDIDA: MÁS DETALLES */}
                  {expandedRow === asistente.id && (
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td colSpan="6" className="px-6 py-6 cursor-default">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                          
                          {/* Sección 1: Información del Empleado (Heredada) */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2">
                              <User size={16} /> Datos Personales
                            </h4>
                            {(() => {
                              const emp = getFullEmpleadoInfo(asistente.empleado_id);
                              return (
                                <>
                                  <p><span className="text-gray-500">Nombre:</span> {emp?.user?.nombre} {emp?.user?.apellido}</p>
                                  <p><span className="text-gray-500">RUT:</span> {formatRUT(emp?.user?.rut, emp?.user?.rut_verificador)}</p>
                                  <p className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400"/> 
                                    {emp?.telefono_personal || 'N/A'}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <MapPin size={14} className="text-gray-400"/> 
                                    {emp?.ciudad || ''} {emp?.direccion}
                                  </p>
                                </>
                              );
                            })()}
                          </div>

                          {/* Sección 2: Datos del Cargo */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2">
                              <FileText size={16} /> Ficha Asistente
                            </h4>
                            <p><span className="text-gray-500">Inicio Contrato:</span> {formatDate(asistente.fecha_inicio)}</p>
                            <p><span className="text-gray-500">Fin Contrato:</span> {formatDate(asistente.fecha_termino) || 'Indefinido'}</p>
                            <p><span className="text-gray-500">Examen Ocupacional:</span> {formatDate(asistente.fecha_examen_ocupacional)}</p>
                            <div className="mt-2">
                              <span className="text-gray-500 block text-xs mb-1">Observaciones:</span>
                              <p className="text-gray-700 bg-white p-2 rounded border border-gray-200 text-xs italic">
                                {asistente.observaciones || 'Sin observaciones registradas'}
                              </p>
                            </div>
                          </div>

                          {/* Sección 3: Estado */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2">
                              <Calendar size={16} /> Estado Actual
                            </h4>
                            <p>
                              <span className="text-gray-500">Estado:</span> 
                              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold uppercase ${getEstadoColor(asistente.estado)}`}>
                                {asistente.estado}
                              </span>
                            </p>
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
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Asistentes</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Administra los asistentes de viaje de la flota.</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 shadow-lg"
            disabled={getEmpleadosDisponibles().length === 0}
          >
            <Plus size={20} />
            Nuevo Asistente
          </Button>
        </div>
        <User className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* BUSCADOR UNIFICADO */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o email..."
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
      ) : (
        renderAsistentesTable()
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
        title={editingAsistente ? 'Editar Asistente' : 'Nuevo Asistente'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
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
          disabled={!!editingAsistente} // No cambiar empleado al editar
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Fecha de Inicio"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
            required
          />
          
          <Input
            label="Fecha de Término"
            type="date"
            value={formData.fecha_termino}
            onChange={(e) => setFormData({ ...formData, fecha_termino: e.target.value })}
          />
        </div>

        <Input
          label="Examen Ocupacional"
          type="date"
          value={formData.fecha_examen_ocupacional}
          onChange={(e) => setFormData({ ...formData, fecha_examen_ocupacional: e.target.value })}
        />

        <Select
          label="Estado"
          options={ESTADOS_ASISTENTE.map(e => ({ id: e, label: e.charAt(0).toUpperCase() + e.slice(1).replace('_', ' ') }))}
          value={formData.estado}
          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Notas adicionales..."
          />
        </div>
      </FormDialog>
    </div>
  );
}