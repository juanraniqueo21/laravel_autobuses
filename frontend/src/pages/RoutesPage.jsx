import React, { useState, useEffect } from 'react';
import { Plus, MapPin, DollarSign, Navigation } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import RutaDetallePage from './RutaDetallePage'; 
import { fetchRutas, createRuta, updateRuta, deleteRuta } from '../services/api';

const ESTADOS_RUTA = ['activa', 'inactiva', 'en_revision'];

export default function RutasPage() {
  // ============================================
  // ESTADOS
  // ============================================
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRuta, setEditingRuta] = useState(null);
  const [selectedRutaId, setSelectedRutaId] = useState(null); // ← NUEVO
  const [formData, setFormData] = useState({
    nombre_ruta: '',
    codigo_ruta: '',
    origen: '',
    destino: '',
    descripcion: '',
    estado: 'activa',
  });

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    loadRutas();
  }, []);

  // ============================================
  // FUNCIONES
  // ============================================
  const loadRutas = async () => {
    try {
      setLoading(true);
      const data = await fetchRutas();
      setRutas(data);
      setError(null);
    } catch (err) {
      console.error('Error completo:', err);
      setError('Error al cargar rutas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (ruta = null) => {
    if (ruta) {
      // Si hay ruta, abrir página de detalle
      setSelectedRutaId(ruta.id);
    } else {
      // Si no hay ruta, abrir modal para crear
      setEditingRuta(null);
      setFormData({
        nombre_ruta: '',
        codigo_ruta: '',
        origen: '',
        destino: '',
        descripcion: '',
        estado: 'activa',
      });
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRuta(null);
  };

  const handleSave = async () => {
    try {
      await createRuta(formData);
      loadRutas();
      handleCloseDialog();
    } catch (err) {
      console.error('Error al guardar:', err);
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta ruta?')) {
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
      'inactiva': 'bg-red-100 text-red-800',
      'en_revision': 'bg-yellow-100 text-yellow-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  // ============================================
  // COLUMNAS DE LA TABLA
  // ============================================
  const columns = [
    { 
      id: 'codigo_ruta', 
      label: 'Código',
      render: (row) => (
        <span className="font-mono font-semibold text-blue-600">
          {row.codigo_ruta}
        </span>
      )
    },
    { 
      id: 'nombre_ruta', 
      label: 'Nombre',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Navigation size={16} className="text-gray-400" />
          <span className="font-medium">{row.nombre_ruta}</span>
        </div>
      )
    },
    { 
      id: 'origen', 
      label: 'Origen',
      render: (row) => (
        <span className="text-gray-700">{row.origen}</span>
      )
    },
    { 
      id: 'destino', 
      label: 'Destino',
      render: (row) => (
        <span className="text-gray-700">{row.destino}</span>
      )
    },
    { 
      id: 'distancia_km', 
      label: 'Distancia',
      render: (row) => (
        <span className="text-gray-600">
          {row.distancia_km ? `${row.distancia_km} km` : '-'}
        </span>
      )
    },
    { 
      id: 'tiempo_estimado_minutos', 
      label: 'Tiempo',
      render: (row) => {
        if (!row.tiempo_estimado_minutos) return '-';
        const horas = Math.floor(row.tiempo_estimado_minutos / 60);
        const minutos = row.tiempo_estimado_minutos % 60;
        return `${horas}h ${minutos}min`;
      }
    },
    { 
      id: 'paradas', 
      label: 'Paradas',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
          <MapPin size={12} />
          {row.paradas?.length || 0}
        </span>
      )
    },
    { 
      id: 'tarifas', 
      label: 'Tarifas',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
          <DollarSign size={12} />
          {row.tarifas?.length || 0}
        </span>
      )
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

  // ============================================
  // RENDER CONDICIONAL
  // ============================================

  // Si hay una ruta seleccionada, mostrar página de detalle
  if (selectedRutaId) {
    return (
      <RutaDetallePage
        rutaId={selectedRutaId}
        onClose={() => {
          setSelectedRutaId(null);
          loadRutas();
        }}
      />
    );
  }

  // ============================================
  // RENDER PRINCIPAL (Lista de rutas)
  // ============================================
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🗺️ Gestión de Rutas</h1>
          <p className="text-gray-600 mt-2">Administra las rutas, paradas y tarifas del sistema</p>
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Rutas</p>
              <p className="text-3xl font-bold text-gray-900">{rutas.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Navigation className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Rutas Activas</p>
              <p className="text-3xl font-bold text-green-600">
                {rutas.filter(r => r.estado === 'activa').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <MapPin className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">En Revisión</p>
              <p className="text-3xl font-bold text-yellow-600">
                {rutas.filter(r => r.estado === 'en_revision').length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table
          columns={columns}
          data={rutas}
          loading={loading}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
        />
      </div>

      {/* Dialog - Solo para CREAR nueva ruta */}
      <FormDialog
        isOpen={openDialog}
        title="Nueva Ruta"
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <div className="space-y-4">
          <Input
            label="Código de Ruta *"
            value={formData.codigo_ruta}
            onChange={(e) => setFormData({ ...formData, codigo_ruta: e.target.value.toUpperCase() })}
            placeholder="PM-TEM-001"
            required
          />

          <Input
            label="Nombre de Ruta *"
            value={formData.nombre_ruta}
            onChange={(e) => setFormData({ ...formData, nombre_ruta: e.target.value })}
            placeholder="Puerto Montt - Temuco"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ciudad de Origen *"
              value={formData.origen}
              onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
              placeholder="Puerto Montt"
              required
            />

            <Input
              label="Ciudad de Destino *"
              value={formData.destino}
              onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
              placeholder="Temuco"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Ruta principal del sur de Chile..."
            />
          </div>

          <Select
            label="Estado *"
            options={ESTADOS_RUTA.map(e => ({ 
              id: e, 
              label: e.charAt(0).toUpperCase() + e.slice(1).replace('_', ' ') 
            }))}
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            required
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Nota:</strong> Después de crear la ruta, podrás agregar paradas y tarifas haciendo clic en "Editar".
            </p>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}