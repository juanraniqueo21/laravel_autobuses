import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchMecanicos, fetchEmpleados, createMecanico, updateMecanico, deleteMecanico } from '../services/api';

const ESTADOS_MECANICO = ['activo', 'inactivo', 'suspendido'];
const ESPECIALIDADES = ['Motor', 'Hidráulica', 'Electricidad', 'Frenos', 'Suspensión', 'Transmisión', 'General'];

export default function MecanicosPage() {
  const [mecanicos, setMecanicos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMecanico, setEditingMecanico] = useState(null);
  const [formData, setFormData] = useState({
    empleado_id: '',
    numero_certificacion: '',
    especialidad: '',
    fecha_certificacion: '',
    fecha_examen_ocupacional: '', // ✅ AGREGADO
    estado: 'activo',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mecanicosData, empleadosData] = await Promise.all([
        fetchMecanicos(),
        fetchEmpleados(),
      ]);
      setMecanicos(mecanicosData);
      
      // ✅ CORREGIDO: Filtrar empleados que NO son mecánicos
      const empleadosSinMecanico = empleadosData.filter(emp => 
        !mecanicosData.some(mec => mec.empleado_id === emp.id)
      );
      setEmpleados(empleadosSinMecanico);
      
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mecanico = null) => {
    if (mecanico) {
      setEditingMecanico(mecanico);
      setFormData({
        empleado_id: mecanico.empleado_id,
        numero_certificacion: mecanico.numero_certificacion || '',
        especialidad: mecanico.especialidad || '',
        fecha_certificacion: mecanico.fecha_certificacion || '',
        fecha_examen_ocupacional: mecanico.fecha_examen_ocupacional || '',
        estado: mecanico.estado || 'activo',
        observaciones: mecanico.observaciones || '',
      });
    } else {
      setEditingMecanico(null);
      setFormData({
        empleado_id: '',
        numero_certificacion: '',
        especialidad: '',
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
      } else {
        await createMecanico(formData);
      }
      loadData();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este mecánico?')) {
      try {
        await deleteMecanico(id);
        loadData();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

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

  const columns = [
    { 
      id: 'empleado_id', 
      label: 'Nombre', 
      render: (row) => getEmpleadoNombre(row.empleado_id) 
    },
    { id: 'especialidad', label: 'Especialidad' },
    { id: 'numero_certificacion', label: 'Certificación' },
    { 
      id: 'fecha_certificacion', 
      label: 'Fecha Certificación',
      render: (row) => formatDate(row.fecha_certificacion)
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Mecánicos</h1>
          <p className="text-gray-600 mt-2">Administra los mecánicos de la empresa</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
          disabled={empleados.length === 0}
        >
          <Plus size={20} />
          Nuevo Mecánico
        </Button>
      </div>

      {/* Mensaje si no hay empleados disponibles */}
      {empleados.length === 0 && !loading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          No hay empleados disponibles para asignar como mecánicos.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Tabla */}
      <Table
        columns={columns}
        data={mecanicos}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingMecanico ? 'Editar Mecánico' : 'Nuevo Mecánico'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <Select
          label="Empleado"
          options={[
            { id: '', label: 'Seleccione un empleado' },
            ...empleados
              .filter(emp =>
                //SOLO rol mecanico(4)
                emp.user?.rol_id === 4 &&
                (!mecanicos.some(m => m.empleado_id === emp.id) || emp.id === formData.empleado_id)
              )
              .map(emp => ({
                id: emp.id,
                label: `${emp.user?.nombre} ${emp.user?.apellido}`
              }))
          ]}
          value={formData.empleado_id}
          onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
          required
        />

        <Select
          label="Especialidad"
          options={[
            { id: '', label: 'Seleccione especialidad' },
            ...ESPECIALIDADES.map(esp => ({ id: esp, label: esp }))
          ]}
          value={formData.especialidad}
          onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
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
          label="Estado"
          options={ESTADOS_MECANICO.map(e => ({ id: e, label: e }))}
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