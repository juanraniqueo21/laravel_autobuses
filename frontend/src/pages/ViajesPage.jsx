import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchViajes, fetchBuses, fetchConductores, fetchAsistentes, fetchRutas, createViaje, updateViaje, deleteViaje } from '../services/api';

const ESTADOS_VIAJE = ['programado', 'en_curso', 'completado', 'cancelado'];

export default function ViajesPage() {
  const [viajes, setViajes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [asistentes, setAsistentes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingViaje, setEditingViaje] = useState(null);
  const [formData, setFormData] = useState({
    bus_id: '',
    conductor_id: '',
    asistente_id: '',
    ruta_id: '',
    fecha_hora_salida: '',
    fecha_hora_llegada: '',
    pasajeros_transportados: '',
    combustible_gastado: '',
    kilometraje_inicial: '',
    kilometraje_final: '',
    estado: 'programado',
    observaciones: '',
    incidentes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [viagesData, busesData, conductoresData, asistentesData, rutasData] = await Promise.all([
        fetchViajes(),
        fetchBuses(),
        fetchConductores(),
        fetchAsistentes(),
        fetchRutas(),
      ]);
      setViajes(viagesData);
      setBuses(busesData);
      
      // filtrar solo conductores activos
      const conductoresActivos = conductoresData.filter(c =>
        c.estado === 'activo' &&
        c.empleado?.estado === 'activo'
      );
      setConductores(conductoresActivos);
      // filtrar solo asistentes activos
      const asistentesActivos = asistentesData.filter(a =>
        a.estado === 'activo' &&
        a.empleado?.estado === 'activo'
      );
      setAsistentes(asistentesActivos);
      setRutas(rutasData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
        
        
  };

  const handleOpenDialog = (viaje = null) => {
    if (viaje) {
      setEditingViaje(viaje);
      setFormData(viaje);
    } else {
      setEditingViaje(null);
      setFormData({
        bus_id: '',
        conductor_id: '',
        asistente_id: '',
        ruta_id: '',
        fecha_hora_salida: '',
        fecha_hora_llegada: '',
        pasajeros_transportados: '',
        combustible_gastado: '',
        kilometraje_inicial: '',
        kilometraje_final: '',
        estado: 'programado',
        observaciones: '',
        incidentes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingViaje(null);
  };

  const handleSave = async () => {
    try {
      if (editingViaje) {
        await updateViaje(editingViaje.id, formData);
      } else {
        await createViaje(formData);
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
        await deleteViaje(id);
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

  const getConductorNombre = (conducId) => {
    const cond = conductores.find(c => c.id === conducId);
    return cond && cond.empleado ? `${cond.empleado.user?.nombre || ''} ${cond.empleado.user?.apellido || ''}` : 'N/A';
  };

  const getRutaNombre = (rutaId) => {
    const ruta = rutas.find(r => r.id === rutaId);
    return ruta ? ruta.nombre_ruta : 'N/A';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'programado': 'bg-blue-100 text-blue-800',
      'en_curso': 'bg-yellow-100 text-yellow-800',
      'completado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { id: 'fecha_hora_salida', label: 'Fecha', render: (row) => row.fecha_hora_salida?.split('T')[0] },
    { id: 'bus_id', label: 'Bus', render: (row) => getPatente(row.bus_id) },
    { id: 'conductor_id', label: 'Conductor', render: (row) => getConductorNombre(row.conductor_id) },
    { id: 'ruta_id', label: 'Ruta', render: (row) => getRutaNombre(row.ruta_id) },
    { id: 'fecha_hora_salida', label: 'Salida', render: (row) => row.fecha_hora_salida?.split('T')[1]?.slice(0, 5) },
    { id: 'fecha_hora_llegada', label: 'Llegada', render: (row) => row.fecha_hora_llegada?.split('T')[1]?.slice(0, 5) || 'N/A' },
    { id: 'pasajeros_transportados', label: 'Pasajeros' },
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Viajes</h1>
          <p className="text-gray-600 mt-2">Administra los viajes de transporte</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Viaje
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
        data={viajes}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingViaje ? 'Editar Viaje' : 'Nuevo Viaje'}
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
          label="Conductor"
          options={conductores.map(cond => ({
            id: cond.id,
            label: `${cond.empleado?.user?.nombre} ${cond.empleado?.user?.apellido}`
          }))}
          value={formData.conductor_id}
          onChange={(e) => setFormData({ ...formData, conductor_id: e.target.value })}
          required
        />

        <Select
          label="Asistente (Opcional)"
          options={[
            { id: '', label: 'Sin asistente' },
            ...asistentes.map(asist => ({
              id: asist.id,
              label: `${asist.empleado?.user?.nombre} ${asist.empleado?.user?.apellido}`
            }))
          ]}
          value={formData.asistente_id}
          onChange={(e) => setFormData({ ...formData, asistente_id: e.target.value })}
        />

        <Select
          label="Ruta"
          options={rutas.map(ruta => ({
            id: ruta.id,
            label: `${ruta.codigo_ruta} - ${ruta.nombre_ruta}`
          }))}
          value={formData.ruta_id}
          onChange={(e) => setFormData({ ...formData, ruta_id: e.target.value })}
          required
        />

        <Input
          label="Fecha y Hora de Salida"
          type="datetime-local"
          value={formData.fecha_hora_salida}
          onChange={(e) => setFormData({ ...formData, fecha_hora_salida: e.target.value })}
          required
        />

        <Input
          label="Fecha y Hora de Llegada"
          type="datetime-local"
          value={formData.fecha_hora_llegada}
          onChange={(e) => setFormData({ ...formData, fecha_hora_llegada: e.target.value })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Pasajeros Transportados"
            type="number"
            value={formData.pasajeros_transportados}
            onChange={(e) => setFormData({ ...formData, pasajeros_transportados: parseInt(e.target.value) })}
          />

          <Input
            label="Combustible Gastado (L)"
            type="number"
            value={formData.combustible_gastado}
            onChange={(e) => setFormData({ ...formData, combustible_gastado: parseFloat(e.target.value) })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Kilometraje Inicial"
            type="number"
            value={formData.kilometraje_inicial}
            onChange={(e) => setFormData({ ...formData, kilometraje_inicial: parseInt(e.target.value) })}
          />

          <Input
            label="Kilometraje Final"
            type="number"
            value={formData.kilometraje_final}
            onChange={(e) => setFormData({ ...formData, kilometraje_final: parseInt(e.target.value) })}
          />
        </div>

        <Select
          label="Estado"
          options={ESTADOS_VIAJE.map(e => ({ id: e, label: e }))}
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
            rows={2}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incidentes
          </label>
          <textarea
            value={formData.incidentes}
            onChange={(e) => setFormData({ ...formData, incidentes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
        </div>
      </FormDialog>
    </div>
  );
}