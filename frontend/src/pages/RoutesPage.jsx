import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchRutas, createRuta, updateRuta, deleteRuta } from '../services/api';

const ESTADOS_RUTA = ['activa', 'inactiva', 'en_revision'];

export default function RoutesPage() {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRuta, setEditingRuta] = useState(null);
  const [formData, setFormData] = useState({
    nombre_ruta: '',
    codigo_ruta: '',
    punto_salida: '',
    punto_destino: '',
    distancia_km: '',
    tiempo_estimado_minutos: '',
    descripcion: '',
    tarifa: '',
    estado: 'activa',
  });

  useEffect(() => {
    loadRutas();
  }, []);

  const loadRutas = async () => {
    try {
      setLoading(true);
      const data = await fetchRutas();
      setRutas(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar rutas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (ruta = null) => {
    if (ruta) {
      setEditingRuta(ruta);
      setFormData(ruta);
    } else {
      setEditingRuta(null);
      setFormData({
        nombre_ruta: '',
        codigo_ruta: '',
        punto_salida: '',
        punto_destino: '',
        distancia_km: '',
        tiempo_estimado_minutos: '',
        descripcion: '',
        tarifa: '',
        estado: 'activa',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRuta(null);
  };

  const handleSave = async () => {
    try {
      if (editingRuta) {
        await updateRuta(editingRuta.id, formData);
      } else {
        await createRuta(formData);
      }
      loadRutas();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await deleteRuta(id);
        loadRutas();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'activa': 'bg-green-100 text-green-800',
      'inactiva': 'bg-orange-100 text-orange-800',
      'en_revision': 'bg-blue-100 text-blue-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { id: 'codigo_ruta', label: 'Código' },
    { id: 'nombre_ruta', label: 'Nombre' },
    { id: 'punto_salida', label: 'Salida' },
    { id: 'punto_destino', label: 'Destino' },
    { id: 'distancia_km', label: 'Km' },
    { id: 'tiempo_estimado_minutos', label: 'Tiempo', render: (row) => `${row.tiempo_estimado_minutos} min` },
    { id: 'tarifa', label: 'Tarifa', render: (row) => `$${row.tarifa}` },
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Rutas</h1>
          <p className="text-gray-600 mt-2">Administra las rutas de transporte</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Ruta
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
        data={rutas}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingRuta ? 'Editar Ruta' : 'Nueva Ruta'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <Input
          label="Código de Ruta"
          value={formData.codigo_ruta}
          onChange={(e) => setFormData({ ...formData, codigo_ruta: e.target.value })}
          required
        />

        <Input
          label="Nombre de Ruta"
          value={formData.nombre_ruta}
          onChange={(e) => setFormData({ ...formData, nombre_ruta: e.target.value })}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Punto de Salida"
            value={formData.punto_salida}
            onChange={(e) => setFormData({ ...formData, punto_salida: e.target.value })}
            required
          />

          <Input
            label="Punto de Destino"
            value={formData.punto_destino}
            onChange={(e) => setFormData({ ...formData, punto_destino: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Distancia (km)"
            type="number"
            value={formData.distancia_km}
            onChange={(e) => setFormData({ ...formData, distancia_km: parseFloat(e.target.value) })}
            required
          />

          <Input
            label="Tiempo Estimado (minutos)"
            type="number"
            value={formData.tiempo_estimado_minutos}
            onChange={(e) => setFormData({ ...formData, tiempo_estimado_minutos: parseInt(e.target.value) })}
            required
          />
        </div>

        <Input
          label="Tarifa (CLP)"
          type="number"
          value={formData.tarifa}
          onChange={(e) => setFormData({ ...formData, tarifa: parseInt(e.target.value) })}
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
            rows={2}
          />
        </div>

        <Select
          label="Estado"
          options={ESTADOS_RUTA.map(e => ({ id: e, label: e }))}
          value={formData.estado}
          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
          required
        />
      </FormDialog>
    </div>
  );
}