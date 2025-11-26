import React, { useState, useEffect } from 'react';
import { Plus, Search, X, ChevronLeft, ChevronRight, Wrench, AlertCircle } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import MultiSelect from '../components/common/MultiSelect'; 
import { fetchMecanicos, fetchEmpleados, createMecanico, updateMecanico, deleteMecanico } from '../services/api';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import { useNotifications } from '../context/NotificationContext';

const ESTADOS_MECANICO = ['activo', 'inactivo', 'suspendido'];
const ESPECIALIDADES = ['Motor', 'Hidráulica', 'Electricidad', 'Frenos', 'Suspensión', 'Transmisión', 'General'];

export default function MecanicosPage() {
  // ==========================================
  // 1. ESTADOS
  // ==========================================
  const [mecanicos, setMecanicos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMecanico, setEditingMecanico] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- HOOK DE NOTIFICACIONES ---
  const { addNotification } = useNotifications();
  
  const [formData, setFormData] = useState({
    empleado_id: '',
    numero_certificacion: '',
    especialidad: [],
    fecha_certificacion: '',
    fecha_examen_ocupacional: '', 
    estado: 'activo',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // 2. CARGA DE DATOS
  // ==========================================
  const loadData = async () => {
    try {
      setLoading(true);
      const [mecanicosData, empleadosData] = await Promise.all([
        fetchMecanicos(),
        fetchEmpleados(),
      ]);
      setMecanicos(Array.isArray(mecanicosData) ? mecanicosData : []);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de los mecánicos.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. LÓGICA DE FILTRO Y PAGINACIÓN
  // ==========================================
  const getFilteredData = () => {
    let data = [...mecanicos].sort((a, b) => b.id - a.id);

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter(m => {
        const nombre = getEmpleadoNombre(m.empleado_id).toLowerCase();
        const cert = (m.numero_certificacion || '').toLowerCase();
        let specs = '';
        if (Array.isArray(m.especialidad)) specs = m.especialidad.join(' ');
        else if (typeof m.especialidad === 'string') specs = m.especialidad;
        
        return nombre.includes(term) || cert.includes(term) || specs.toLowerCase().includes(term);
      });
    }
    return data;
  };

  const filteredData = getFilteredData();
  
  // IMPLEMENTACIÓN DE PAGINACIÓN
  const { currentPage, setCurrentPage, totalPages, paginatedData } = usePagination(filteredData, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ==========================================
  // 4. HANDLERS
  // ==========================================
  const handleOpenDialog = (mecanico = null) => {
    if (mecanico) {
      setEditingMecanico(mecanico);
      
      let especialidadesArray = [];
      if (Array.isArray(mecanico.especialidad)) {
        especialidadesArray = mecanico.especialidad;
      } else if (typeof mecanico.especialidad === 'string' && mecanico.especialidad.startsWith('[')) {
          try {
            especialidadesArray = JSON.parse(mecanico.especialidad);
          } catch (e) {
             especialidadesArray = [mecanico.especialidad];
          }
      } else if (mecanico.especialidad) {
        especialidadesArray = [mecanico.especialidad];
      }

      setFormData({
        empleado_id: mecanico.empleado_id,
        numero_certificacion: mecanico.numero_certificacion || '',
        especialidad: especialidadesArray,
        fecha_certificacion: mecanico.fecha_certificacion ? mecanico.fecha_certificacion.split('T')[0] : '',
        fecha_examen_ocupacional: mecanico.fecha_examen_ocupacional ? mecanico.fecha_examen_ocupacional.split('T')[0] : '',
        estado: mecanico.estado || 'activo',
        observaciones: mecanico.observaciones || '',
      });
    } else {
      setEditingMecanico(null);
      setFormData({
        empleado_id: '',
        numero_certificacion: '',
        especialidad: [],
        fecha_certificacion: '',
        fecha_examen_ocupacional: '',
        estado: 'activo',
        observaciones: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMecanico(null);
  };

  const handleSave = async () => {
    try {
      if (editingMecanico) {
        await updateMecanico(editingMecanico.id, formData);
        const nombre = getEmpleadoNombre(formData.empleado_id);
        addNotification('success', 'Mecánico Actualizado', `Los datos de ${nombre} han sido actualizados.`);
      } else {
        await createMecanico(formData);
        addNotification('success', 'Nuevo Mecánico', 'El mecánico ha sido registrado exitosamente.');
      }
      loadData();
      handleCloseDialog();
    } catch (err) {
      addNotification('error', 'Error', 'No se pudieron guardar los datos.');
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este mecánico?')) {
      try {
        await deleteMecanico(id);
        addNotification('warning', 'Mecánico Eliminado', 'El registro ha sido eliminado del sistema.');
        loadData();
      } catch (err) {
        addNotification('error', 'Error', 'No se pudo eliminar el mecánico.');
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  // Helpers
  const getEmpleadoNombre = (empleadoId) => {
    const emp = empleados.find(e => e.id === empleadoId) || 
                mecanicos.find(m => m.empleado_id === empleadoId)?.empleado;
    return emp ? `${emp.user?.nombre || ''} ${emp.user?.apellido || ''}`.trim() : 'N/A';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'activo': 'bg-green-100 text-green-800',
      'inactivo': 'bg-orange-100 text-orange-800',
      'suspendido': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL');
  };
  
  const getEmpleadosDisponibles = () => {
    return empleados.filter(empleado => {
      if (empleado.estado !== 'activo') return false;
      if (empleado.user?.rol_id !== 4) return false;
      
      const yaEsMecanicoActivo = mecanicos.some(
        m => m.empleado_id === empleado.id && m.estado === 'activo'
      );
      
      if (editingMecanico && empleado.id === editingMecanico.empleado_id) {
        return true;
      }
      return !yaEsMecanicoActivo;
    });
  };

  // Columnas
  const columns = [
    { 
      id: 'empleado_id', 
      label: 'Nombre', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <Wrench size={16} className="text-gray-400" />
          <span className="font-medium text-gray-900">{getEmpleadoNombre(row.empleado_id)}</span>
        </div>
      )
    },
    { 
      id: 'especialidad', 
      label: 'Especialidades',
      render: (row) => {
        const specs = Array.isArray(row.especialidad) 
           ? row.especialidad 
           : (row.especialidad ? [row.especialidad] : []);
           
        return (
          <div className="flex flex-wrap gap-1">
            {specs.map((esp, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                {esp}
              </span>
            ))}
          </div>
        );
      }
    },
    { id: 'numero_certificacion', label: 'Certificación' },
    { 
      id: 'fecha_certificacion', 
      label: 'F. Certificación',
      render: (row) => formatDate(row.fecha_certificacion)
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoColor(row.estado)}`}>
          {row.estado}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Mecánicos</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Administra el personal técnico y sus especialidades.</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Nuevo Mecánico
          </Button>
        </div>
        <Wrench className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {empleados.length === 0 && !loading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          <span>No hay empleados disponibles para asignar como mecánicos.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, certificación o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table
          columns={columns}
          data={paginatedData}
          loading={loading}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
        />
      </div>

      {/* PAGINACIÓN COMPONENTE */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <FormDialog
        isOpen={openDialog}
        title={editingMecanico ? 'Editar Mecánico' : 'Nuevo Mecánico'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <Select
          label="Empleado *"
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
          disabled={!!editingMecanico} 
        />

        <MultiSelect
          label="Especialidades *"
          options={ESPECIALIDADES.map(esp => ({ id: esp, label: esp }))}
          value={formData.especialidad}
          onChange={(newValue) => setFormData({ ...formData, especialidad: newValue })}
          required
        />

        <Input
          label="Número de Certificación"
          value={formData.numero_certificacion}
          onChange={(e) => setFormData({ ...formData, numero_certificacion: e.target.value })}
          placeholder="Número de certificación profesional"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha de Certificación"
            type="date"
            value={formData.fecha_certificacion}
            onChange={(e) => setFormData({ ...formData, fecha_certificacion: e.target.value })}
          />
          <Input
            label="Fecha de Examen Ocupacional"
            type="date"
            value={formData.fecha_examen_ocupacional}
            onChange={(e) => setFormData({ ...formData, fecha_examen_ocupacional: e.target.value })}
          />
        </div>

        <Select
          label="Estado *"
          options={ESTADOS_MECANICO.map(e => ({ id: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))}
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
            placeholder="Observaciones adicionales..."
          />
        </div>
      </FormDialog>
    </div>
  );
}