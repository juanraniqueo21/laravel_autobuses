import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchAsistentes, fetchEmpleados, createAsistente, updateAsistente, deleteAsistente } from '../services/api';

const ESTADOS_ASISTENTE = ['activo', 'inactivo', 'suspendido'];

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
    estado: 'activo',
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
      setFormData(asistente);
    } else {
      setEditingAsistente(null);
      setFormData({
        empleado_id: '',
        fecha_inicio: '',
        estado: 'activo',
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
    if (window.confirm('¿Estás seguro?')) {
      try {
        await deleteAsistente(id);
        loadData();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const getEmpleadoNombre = (empleadoId) => {
    const emp = empleados.find(e => e.id === empleadoId);
    return emp ? `${emp.user?.nombre || ''} ${emp.user?.apellido || ''}` : 'N/A';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'activo': 'bg-green-100 text-green-800',
      'inactivo': 'bg-orange-100 text-orange-800',
      'suspendido': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { id: 'empleado_id', label: 'Nombre', render: (row) => getEmpleadoNombre(row.empleado_id) },
    { id: 'fecha_inicio', label: 'Fecha Inicio' },
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
          options={empleados.filter(emp => emp.user?.rol_id === 5).map(emp => ({
            id: emp.id,
            label: `${emp.user?.nombre} ${emp.user?.apellido}`
          }))}
          value={formData.empleado_id}
          onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
          required
        />

        <Input
          label="Fecha de Inicio"
          type="date"
          value={formData.fecha_inicio}
          onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
          required
        />

        <Select
          label="Estado"
          options={ESTADOS_ASISTENTE.map(e => ({ id: e, label: e }))}
          value={formData.estado}
          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
          required
        />
      </FormDialog>
    </div>
  );
}