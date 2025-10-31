import React, { useState, useEffect } from 'react';
import { Plus, Filter, X } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchBuses, createBus, updateBus, deleteBus } from '../services/api';

const ESTADOS_BUS = ['operativo', 'mantenimiento', 'desmantelado'];

export default function BusesPage() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    patente: '',
    estado: '',
    anio: '',
    marca: '',
  });

  const [formData, setFormData] = useState({
    patente: '',
    patente_verificador: '',
    marca: '',
    modelo: '',
    anio: '',
    numero_serie: '',
    numero_motor: '',
    capacidad_pasajeros: '',
    fecha_adquisicion: '',
    estado: 'operativo',
    proxima_revision_tecnica: '',
    ultima_revision_tecnica: '',
    documento_revision_tecnica: '',
    vencimiento_seguro: '',
    numero_permiso_circulacion: '',
    numero_soap: '',
    observaciones: '',
    kilometraje_original: '',
    kilometraje_actual: '',
  });

  useEffect(() => {
    loadBuses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [buses, filters]);

  const loadBuses = async () => {
    try {
      setLoading(true);
      const data = await fetchBuses();
      setBuses(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar buses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = buses;

    if (filters.patente) {
      filtered = filtered.filter(b =>
        b.patente.toLowerCase().includes(filters.patente.toLowerCase())
      );
    }

    if (filters.estado) {
      filtered = filtered.filter(b => b.estado === filters.estado);
    }

    if (filters.anio) {
      filtered = filtered.filter(b => b.anio == filters.anio);
    }

    if (filters.marca) {
      filtered = filtered.filter(b =>
        b.marca.toLowerCase().includes(filters.marca.toLowerCase())
      );
    }

    setFilteredBuses(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleClearFilters = () => {
    setFilters({
      patente: '',
      estado: '',
      anio: '',
      marca: '',
    });
  };

  const handleOpenDialog = (bus = null) => {
    if (bus) {
      setEditingBus(bus);
      setFormData(bus);
    } else {
      setEditingBus(null);
      setFormData({
        patente: '',
        patente_verificador: '',
        marca: '',
        modelo: '',
        anio: '',
        numero_serie: '',
        numero_motor: '',
        capacidad_pasajeros: '',
        fecha_adquisicion: '',
        estado: 'operativo',
        proxima_revision_tecnica: '',
        ultima_revision_tecnica: '',
        documento_revision_tecnica: '',
        vencimiento_seguro: '',
        numero_permiso_circulacion: '',
        numero_soap: '',
        observaciones: '',
        kilometraje_original: '',
        kilometraje_actual: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBus(null);
  };

  const handleSave = async () => {
    try {
      if (editingBus) {
        await updateBus(editingBus.id, formData);
      } else {
        await createBus(formData);
      }
      loadBuses();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await deleteBus(id);
        loadBuses();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'operativo': 'bg-green-100 text-green-800',
      'mantenimiento': 'bg-yellow-100 text-yellow-800',
      'desmantelado': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const marcas = [...new Set(buses.map(b => b.marca))];
  const anios = [...new Set(buses.map(b => b.anio))].sort((a, b) => b - a);

  const columns = [
    { id: 'patente', label: 'Patente' },
    { id: 'marca', label: 'Marca' },
    { id: 'modelo', label: 'Modelo' },
    { id: 'anio', label: 'Año' },
    { id: 'capacidad_pasajeros', label: 'Cap.' },
    { id: 'kilometraje_original', label: 'Km Orig.' },
    { id: 'kilometraje_actual', label: 'Km Actual' },
    { id: 'proxima_revision_tecnica', label: 'Rev. Técnica' },
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Buses</h1>
          <p className="text-gray-600 mt-2">Administra los buses de la empresa</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Bus
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 mb-4"
        >
          <Filter size={18} />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </Button>

        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Input
                label="Buscar por Patente"
                value={filters.patente}
                onChange={(e) => handleFilterChange('patente', e.target.value)}
              />

              <Select
                label="Estado"
                options={[
                  { id: '', label: 'Todos' },
                  ...ESTADOS_BUS.map(e => ({ id: e, label: e }))
                ]}
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
              />

              <Select
                label="Año"
                options={[
                  { id: '', label: 'Todos' },
                  ...anios.map(a => ({ id: a, label: a }))
                ]}
                value={filters.anio}
                onChange={(e) => handleFilterChange('anio', e.target.value)}
              />

              <Select
                label="Marca"
                options={[
                  { id: '', label: 'Todos' },
                  ...marcas.map(m => ({ id: m, label: m }))
                ]}
                value={filters.marca}
                onChange={(e) => handleFilterChange('marca', e.target.value)}
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X size={16} />
              Limpiar Filtros
            </Button>
          </div>
        )}

        <div className="text-sm text-gray-600 mb-4">
          Resultados: <strong>{filteredBuses.length}</strong> buses
        </div>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={filteredBuses}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingBus ? 'Editar Bus' : 'Nuevo Bus'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Patente"
            value={formData.patente}
            onChange={(e) => setFormData({ ...formData, patente: e.target.value })}
            required
          />
          <Input
            label="Verificador"
            value={formData.patente_verificador}
            onChange={(e) => setFormData({ ...formData, patente_verificador: e.target.value })}
          />
          <Input
            label="Marca"
            value={formData.marca}
            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
            required
          />
          <Input
            label="Modelo"
            value={formData.modelo}
            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
            required
          />
          <Input
            label="Año Fabricación"
            type="number"
            value={formData.anio}
            onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) })}
            required
          />
          <Input
            label="Capacidad Pasajeros"
            type="number"
            value={formData.capacidad_pasajeros}
            onChange={(e) => setFormData({ ...formData, capacidad_pasajeros: parseInt(e.target.value) })}
            required
          />
          <Input
            label="Número Serie"
            value={formData.numero_serie}
            onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
          />
          <Input
            label="Número Motor"
            value={formData.numero_motor}
            onChange={(e) => setFormData({ ...formData, numero_motor: e.target.value })}
          />
          <Input
            label="Fecha Adquisición"
            type="date"
            value={formData.fecha_adquisicion}
            onChange={(e) => setFormData({ ...formData, fecha_adquisicion: e.target.value })}
          />
          <Select
            label="Estado"
            options={ESTADOS_BUS.map(e => ({ id: e, label: e }))}
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            required
          />
          <Input
            label="Km Original"
            type="number"
            value={formData.kilometraje_original}
            onChange={(e) => setFormData({ ...formData, kilometraje_original: parseInt(e.target.value) })}
          />
          <Input
            label="Km Actual"
            type="number"
            value={formData.kilometraje_actual}
            onChange={(e) => setFormData({ ...formData, kilometraje_actual: parseInt(e.target.value) })}
          />
          <Input
            label="Última Revisión Técnica"
            type="date"
            value={formData.ultima_revision_tecnica}
            onChange={(e) => setFormData({ ...formData, ultima_revision_tecnica: e.target.value })}
          />
          <Input
            label="Próxima Revisión Técnica"
            type="date"
            value={formData.proxima_revision_tecnica}
            onChange={(e) => setFormData({ ...formData, proxima_revision_tecnica: e.target.value })}
          />
          <Input
            label="Vencimiento Seguro"
            type="date"
            value={formData.vencimiento_seguro}
            onChange={(e) => setFormData({ ...formData, vencimiento_seguro: e.target.value })}
          />
          <Input
            label="Permiso Circulación"
            value={formData.numero_permiso_circulacion}
            onChange={(e) => setFormData({ ...formData, numero_permiso_circulacion: e.target.value })}
          />
          <Input
            label="SOAP"
            value={formData.numero_soap}
            onChange={(e) => setFormData({ ...formData, numero_soap: e.target.value })}
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