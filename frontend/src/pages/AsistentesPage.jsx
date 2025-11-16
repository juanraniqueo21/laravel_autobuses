import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchAsistentes, fetchEmpleados, createAsistente, updateAsistente, deleteAsistente } from '../services/api';

const ESTADOS_ASISTENTE = ['activo', 'inactivo', 'licencia_medica', 'suspendido'];

export default function AsistentesPage() {
  const [asistentes, setAsistentes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAsistente, setEditingAsistente] = useState(null);
  const [formData, setFormData] = useState({
    empleado_id: '',
    fecha_inicio: '',
    fecha_termino: '',
    fecha_examen_ocupacional: '',
    estado: 'activo',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (asistente = null) => {
    if (asistente) {
      setEditingAsistente(asistente);
      setFormData({
        empleado_id: asistente.empleado_id,
        fecha_inicio: asistente.fecha_inicio || '',
        fecha_termino: asistente.fecha_termino || '',
        fecha_examen_ocupacional: asistente.fecha_examen_ocupacional || '',
        estado: asistente.estado || 'activo',
        observaciones: asistente.observaciones || '',
      });
    } else {
      setEditingAsistente(null);
      setFormData({
        empleado_id: '',
        fecha_inicio: '',
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
      } else {
        await createAsistente(formData);
      }
      loadData();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este asistente?')) {
      try {
        await deleteAsistente(id);
        loadData();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const getEmpleadoNombre = (empleadoId) => {
    const emp = empleados.find(e => e.id === empleadoId) || 
                asistentes.find(a => a.empleado_id === empleadoId)?.empleado;
    return emp ? `${emp.user?.nombre || ''} ${emp.user?.apellido || ''}`.trim() : 'N/A';
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

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CL');
  };

  // Filtrar empleados disponibles para asignar como asistentes
  const getEmpleadosDisponibles = () => {
    return empleados.filter(empleado => {
      // 1. Solo empleados activos
      if (empleado.estado !== 'activo') {
        return false;
      }
      
      // 2. Solo rol asistente (rol_id = 5)
      // NOTA: Verifica cuál es el rol_id de asistente en TU base de datos
      if (empleado.user?.rol_id !== 5) {
        return false;
      }
      
      // 3. Verificar que no sea asistente ACTIVO
      const yaEsAsistenteActivo = asistentes.some(
        a => a.empleado_id === empleado.id && a.estado === 'activo'
      );
      
      // 4. Si estamos editando, permitir el empleado actual
      if (editingAsistente && empleado.id === editingAsistente.empleado_id) {
        return true;
      }
      
      return !yaEsAsistenteActivo;
    });
  };

  const columns = [
    { 
      id: 'empleado_id', 
      label: 'Nombre', 
      render: (row) => getEmpleadoNombre(row.empleado_id) 
    },
    { 
      id: 'fecha_inicio', 
      label: 'Fecha Inicio',
      render: (row) => formatDate(row.fecha_inicio)
    },
    { 
      id: 'fecha_examen_ocupacional', 
      label: 'Examen Ocupacional',
      render: (row) => formatDate(row.fecha_examen_ocupacional)
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoColor(row.estado)}`}>
          {row.estado}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Asistentes</h1>
          <p className="text-gray-600 mt-2">Administra los asistentes de viaje</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
          disabled={getEmpleadosDisponibles().length === 0}
        >
          <Plus size={20} />
          Nuevo Asistente
        </Button>
      </div>

      

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Tabla */}
      <Table
        columns={columns}
        data={asistentes}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
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
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Fecha de Inicio"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
          />
          
          <Input
            label="Fecha de Término"
            type="date"
            value={formData.fecha_termino}
            onChange={(e) => setFormData({ ...formData, fecha_termino: e.target.value })}
          />
        </div>

        <Input
          label="Fecha de Examen Ocupacional"
          type="date"
          value={formData.fecha_examen_ocupacional}
          onChange={(e) => setFormData({ ...formData, fecha_examen_ocupacional: e.target.value })}
        />

        <Select
          label="Estado"
          options={ESTADOS_ASISTENTE.map(e => ({ id: e, label: e }))}
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