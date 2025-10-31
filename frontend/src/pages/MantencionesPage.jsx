import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { 
  fetchBuses, 
  fetchEmpleados, 
  fetchMantenimientos,
  createMantenimiento, 
  updateMantenimiento, 
  deleteMantenimiento 
} from '../services/api';

const TIPOS_MANTENIMIENTO = ['preventivo', 'correctivo', 'revision'];
const ESTADOS_MANTENIMIENTO = ['en_proceso', 'completado', 'cancelado'];

export default function MantencionesPage() {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [buses, setBuses] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState(null);
  const [formData, setFormData] = useState({
    bus_id: '',
    mecanico_id: '',
    tipo_mantenimiento: 'preventivo',
    descripcion: '',
    fecha_inicio: '',
    fecha_termino: '',
    costo_total: '',
    estado: 'en_proceso',
    repuestos_utilizados: '',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [busesData, empleadosData, mantenimientosData] = await Promise.all([
        fetchBuses(),
        fetchEmpleados(),
        fetchMantenimientos(),
      ]);
      
      setBuses(busesData);
      const mechanics = empleadosData.filter(emp => emp.mecanico);
      setMecanicos(mechanics);
      setMantenimientos(mantenimientosData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mantenimiento = null) => {
    if (mantenimiento) {
      setEditingMantenimiento(mantenimiento);
      setFormData(mantenimiento);
    } else {
      setEditingMantenimiento(null);
      setFormData({
        bus_id: '',
        mecanico_id: '',
        tipo_mantenimiento: 'preventivo',
        descripcion: '',
        fecha_inicio: '',
        fecha_termino: '',
        costo_total: '',
        estado: 'en_proceso',
        repuestos_utilizados: '',
        observaciones: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMantenimiento(null);
  };

  const handleSave = async () => {
    try {
      if (editingMantenimiento) {
        await updateMantenimiento(editingMantenimiento.id, formData);
      } else {
        await createMantenimiento(formData);
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
        await deleteMantenimiento(id);
        loadData();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const getPatente = (busId) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? bus.patente : 'N/A';
  };

  const getMecanicoNombre = (mecanicoId) => {
    const mecanico = mecanicos.find(m => m.mecanico && m.mecanico.id === mecanicoId);
    return mecanico ? `${mecanico.user?.nombre || ''} ${mecanico.user?.apellido || ''}` : 'N/A';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value || 0);
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'en_proceso': 'bg-yellow-100 text-yellow-800',
      'completado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { id: 'bus_id', label: 'Patente Bus', render: (row) => getPatente(row.bus_id) },
    { id: 'mecanico_id', label: 'Mecánico', render: (row) => getMecanicoNombre(row.mecanico_id) },
    { id: 'tipo_mantenimiento', label: 'Tipo' },
    { id: 'descripcion', label: 'Descripción' },
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
    { id: 'costo_total', label: 'Costo', render: (row) => formatCurrency(row.costo_total) },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Mantenimiento</h1>
          <p className="text-gray-600 mt-2">Administra el mantenimiento de los buses</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Mantenimiento
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
        data={mantenimientos}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingMantenimiento ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <Select
          label="Bus"
          options={buses.map(bus => ({
            id: bus.id,
            label: `${bus.patente} - ${bus.marca} ${bus.modelo}`
          }))}
          value={formData.bus_id}
          onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
          required
        />

        <Select
          label="Mecánico"
          options={mecanicos.map(mec => ({
            id: mec.mecanico.id,
            label: `${mec.user?.nombre} ${mec.user?.apellido}`
          }))}
          value={formData.mecanico_id}
          onChange={(e) => setFormData({ ...formData, mecanico_id: e.target.value })}
          required
        />

        <Select
          label="Tipo de Mantenimiento"
          options={TIPOS_MANTENIMIENTO.map(t => ({ id: t, label: t }))}
          value={formData.tipo_mantenimiento}
          onChange={(e) => setFormData({ ...formData, tipo_mantenimiento: e.target.value })}
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          label="Costo Total (CLP)"
          type="number"
          value={formData.costo_total}
          onChange={(e) => setFormData({ ...formData, costo_total: parseInt(e.target.value) })}
          required
        />

        <Select
          label="Estado"
          options={ESTADOS_MANTENIMIENTO.map(e => ({ id: e, label: e }))}
          value={formData.estado}
          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repuestos Utilizados
          </label>
          <textarea
            value={formData.repuestos_utilizados}
            onChange={(e) => setFormData({ ...formData, repuestos_utilizados: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            placeholder="Ej: Aceite 5W30, Filtro aire, etc."
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
        </div>
      </FormDialog>
    </div>
  );
}