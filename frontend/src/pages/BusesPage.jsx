import React, { useState, useEffect } from 'react';
import { Plus, Filter, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchBuses, createBus, updateBus, deleteBus } from '../services/api';

const ESTADOS_BUS = ['operativo', 'mantenimiento', 'desmantelado'];
const TIPOS_COMBUSTIBLE = ['diesel', 'gasolina', 'gas', 'eléctrico', 'híbrido'];
const TIPOS_COBERTURA = ['ninguna', 'terceros', 'full'];

export default function BusesPage() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

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
    tipo_combustible: 'diesel',
    color: '',
    anio: '',
    numero_serie: '',
    numero_motor: '',
    capacidad_pasajeros: '',
    fecha_adquisicion: '',
    estado: 'operativo',
    proxima_revision_tecnica: '',
    ultima_revision_tecnica: '',
    documento_revision_tecnica: '',
    numero_soap: '',
    vencimiento_soap: '',
    compania_seguro: '',
    numero_poliza: '',
    tipo_cobertura_adicional: 'ninguna',
    vencimiento_poliza: '',
    numero_permiso_circulacion: '',
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

  // Auto-ocultar mensajes de éxito/error
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadBuses = async () => {
    try {
      setLoading(true);
      const data = await fetchBuses();
      
      if (Array.isArray(data)) {
        setBuses(data);
      } else {
        console.error('Los datos no son un array:', data);
        setBuses([]);
      }
      
      setError(null);
    } catch (err) {
      setError('Error al cargar buses: ' + err.message);
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(buses)) {
      setFilteredBuses([]);
      return;
    }

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

  // Formatear patente automáticamente (ABCD12 → AB·CD·12)
  const handlePatenteChange = (value) => {
    // Remover espacios y puntos
    let clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Limitar a 6 caracteres
    clean = clean.substring(0, 6);
    
    setFormData({ ...formData, patente: clean });
  };

  // Formatear patente para visualización
  const formatPatente = (patente) => {
    if (!patente || patente.length !== 6) return patente;
    return `${patente.substring(0, 2)}·${patente.substring(2, 4)}·${patente.substring(4, 6)}`;
  };

  // Formatear fecha (2025-10-31T00:00:00.000000Z → 31/10/2025)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
  };

  const handleOpenDialog = (bus = null) => {
    if (bus) {
      setEditingBus(bus);
      setFormData({
        ...bus,
        // Convertir fechas ISO a formato YYYY-MM-DD para inputs
        fecha_adquisicion: bus.fecha_adquisicion ? bus.fecha_adquisicion.split('T')[0] : '',
        proxima_revision_tecnica: bus.proxima_revision_tecnica ? bus.proxima_revision_tecnica.split('T')[0] : '',
        ultima_revision_tecnica: bus.ultima_revision_tecnica ? bus.ultima_revision_tecnica.split('T')[0] : '',
        vencimiento_soap: bus.vencimiento_soap ? bus.vencimiento_soap.split('T')[0] : '',
        vencimiento_poliza: bus.vencimiento_poliza ? bus.vencimiento_poliza.split('T')[0] : '',
      });
    } else {
      setEditingBus(null);
      setFormData({
        patente: '',
        patente_verificador: '',
        marca: '',
        modelo: '',
        tipo_combustible: 'diesel',
        color: '',
        anio: '',
        numero_serie: '',
        numero_motor: '',
        capacidad_pasajeros: '',
        fecha_adquisicion: '',
        estado: 'operativo',
        proxima_revision_tecnica: '',
        ultima_revision_tecnica: '',
        documento_revision_tecnica: '',
        numero_soap: '',
        vencimiento_soap: '',
        compania_seguro: '',
        numero_poliza: '',
        tipo_cobertura_adicional: 'ninguna',
        vencimiento_poliza: '',
        numero_permiso_circulacion: '',
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
        setSuccess('Bus actualizado exitosamente');
      } else {
        await createBus(formData);
        setSuccess('Bus creado exitosamente');
      }
      loadBuses();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este bus?')) {
      try {
        await deleteBus(id);
        setSuccess('Bus eliminado exitosamente');
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

  const getCoberturaLabel = (tipo) => {
    const labels = {
      'ninguna': 'Solo SOAP',
      'terceros': 'Terceros',
      'full': 'Full'
    };
    return labels[tipo] || tipo;
  };

  const marcas = Array.isArray(buses) ? [...new Set(buses.map(b => b.marca))].filter(Boolean) : [];
  const anios = Array.isArray(buses) ? [...new Set(buses.map(b => b.anio))].sort((a, b) => b - a) : [];

  const columns = [
    { 
      id: 'patente', 
      label: 'Patente',
      render: (row) => (
        <span className="font-mono font-semibold text-blue-600">
          {formatPatente(row.patente)}
        </span>
      )
    },
    { id: 'marca', label: 'Marca' },
    { id: 'modelo', label: 'Modelo' },
    { id: 'anio', label: 'Año' },
    { 
      id: 'tipo_combustible', 
      label: 'Combustible',
      render: (row) => (
        <span className="capitalize">{row.tipo_combustible}</span>
      )
    },
    { id: 'capacidad_pasajeros', label: 'Capacidad' },
    {
      id: 'estado',
      label: 'Estado',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoColor(row.estado)}`}>
          {row.estado}
        </span>
      ),
    },
    {
      id: 'actions',
      label: '',
      render: (row) => (
        <button
          onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
          className="text-blue-600 hover:text-blue-800 p-2"
          title="Ver detalles"
        >
          {expandedRow === row.id ? <ChevronUp size={20} /> : <Eye size={20} />}
        </button>
      ),
    },
  ];

  const renderExpandedRow = (bus) => (
    <tr className="bg-gray-50">
      <td colSpan="8" className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* COLUMNA 1: IDENTIFICACIÓN */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Identificación</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Patente:</span>
                <span className="ml-2 font-mono font-semibold text-blue-600">{formatPatente(bus.patente)}</span>
              </div>
              {bus.patente_verificador && (
                <div>
                  <span className="font-medium text-gray-600">Verificador:</span>
                  <span className="ml-2">{bus.patente_verificador}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-600">Marca/Modelo:</span>
                <span className="ml-2">{bus.marca} {bus.modelo}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Año:</span>
                <span className="ml-2">{bus.anio}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Color:</span>
                <span className="ml-2">{bus.color || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Combustible:</span>
                <span className="ml-2 capitalize">{bus.tipo_combustible}</span>
              </div>
              {bus.numero_serie && (
                <div>
                  <span className="font-medium text-gray-600">N° Serie:</span>
                  <span className="ml-2 font-mono text-xs">{bus.numero_serie}</span>
                </div>
              )}
              {bus.numero_motor && (
                <div>
                  <span className="font-medium text-gray-600">N° Motor:</span>
                  <span className="ml-2 font-mono text-xs">{bus.numero_motor}</span>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA 2: OPERACIÓN */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Operación</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Capacidad:</span>
                <span className="ml-2">{bus.capacidad_pasajeros} pasajeros</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Km Original:</span>
                <span className="ml-2">{bus.kilometraje_original?.toLocaleString() || 0} km</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Km Actual:</span>
                <span className="ml-2">{bus.kilometraje_actual?.toLocaleString() || 0} km</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Km Recorridos:</span>
                <span className="ml-2">{((bus.kilometraje_actual || 0) - (bus.kilometraje_original || 0)).toLocaleString()} km</span>
              </div>
              {bus.fecha_adquisicion && (
                <div>
                  <span className="font-medium text-gray-600">Adquisición:</span>
                  <span className="ml-2">{formatDate(bus.fecha_adquisicion)}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-600">Estado:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getEstadoColor(bus.estado)}`}>
                  {bus.estado}
                </span>
              </div>
            </div>

            {/* REVISIÓN TÉCNICA */}
            <h4 className="font-semibold text-gray-700 mt-4 mb-2 border-b pb-2">Revisión Técnica</h4>
            <div className="space-y-2 text-sm">
              {bus.ultima_revision_tecnica && (
                <div>
                  <span className="font-medium text-gray-600">Última:</span>
                  <span className="ml-2">{formatDate(bus.ultima_revision_tecnica)}</span>
                </div>
              )}
              {bus.proxima_revision_tecnica && (
                <div>
                  <span className="font-medium text-gray-600">Próxima:</span>
                  <span className="ml-2">{formatDate(bus.proxima_revision_tecnica)}</span>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA 3: SEGUROS */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Seguros y Documentos</h4>
            
            {/* SOAP */}
            <div className="mb-4">
              <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">SOAP</h5>
              <div className="space-y-2 text-sm">
                {bus.numero_soap && (
                  <div>
                    <span className="font-medium text-gray-600">N° SOAP:</span>
                    <span className="ml-2 font-mono text-xs">{bus.numero_soap}</span>
                  </div>
                )}
                {bus.vencimiento_soap && (
                  <div>
                    <span className="font-medium text-gray-600">Vencimiento:</span>
                    <span className="ml-2">{formatDate(bus.vencimiento_soap)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* COBERTURA ADICIONAL */}
            <div>
              <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Cobertura Adicional</h5>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Tipo:</span>
                  <span className="ml-2">{getCoberturaLabel(bus.tipo_cobertura_adicional)}</span>
                </div>
                {bus.compania_seguro && (
                  <div>
                    <span className="font-medium text-gray-600">Compañía:</span>
                    <span className="ml-2">{bus.compania_seguro}</span>
                  </div>
                )}
                {bus.numero_poliza && (
                  <div>
                    <span className="font-medium text-gray-600">N° Póliza:</span>
                    <span className="ml-2 font-mono text-xs">{bus.numero_poliza}</span>
                  </div>
                )}
                {bus.vencimiento_poliza && (
                  <div>
                    <span className="font-medium text-gray-600">Vencimiento:</span>
                    <span className="ml-2">{formatDate(bus.vencimiento_poliza)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* PERMISOS */}
            {bus.numero_permiso_circulacion && (
              <div className="mt-4">
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Permisos</h5>
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Permiso Circulación:</span>
                  <span className="ml-2 font-mono text-xs">{bus.numero_permiso_circulacion}</span>
                </div>
              </div>
            )}

            {/* OBSERVACIONES */}
            {bus.observaciones && (
              <div className="mt-4">
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Observaciones</h5>
                <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                  {bus.observaciones}
                </p>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Buses</h1>
          <p className="text-gray-600 mt-2">Administra la flota de buses de la empresa</p>
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

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-900">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X size={18} />
          </button>
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
                placeholder="ABCD12"
              />

              <Select
                label="Estado"
                options={[
                  { id: '', label: 'Todos' },
                  ...ESTADOS_BUS.map(e => ({ id: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))
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

      {/* Tabla con filas expandibles */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : filteredBuses.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                  No hay buses registrados
                </td>
              </tr>
            ) : (
              filteredBuses.map((bus) => (
                <React.Fragment key={bus.id}>
                  <tr className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={col.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {col.render ? col.render(bus) : bus[col.id]}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenDialog(bus)}
                        className="mr-2"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(bus.id)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                  {expandedRow === bus.id && renderExpandedRow(bus)}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingBus ? 'Editar Bus' : 'Nuevo Bus'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IDENTIFICACIÓN */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Identificación del Vehículo</h3>
          </div>

          <Input
            label="Patente *"
            value={formData.patente}
            onChange={(e) => handlePatenteChange(e.target.value)}
            required
            placeholder="ABCD12"
            maxLength={6}
            helpText="4 letras y 2 números"
          />
          <Input
            label="Dígito Verificador"
            value={formData.patente_verificador}
            onChange={(e) => setFormData({ ...formData, patente_verificador: e.target.value.toUpperCase() })}
            maxLength={1}
            placeholder="Ej: 5"
          />
          <Input
            label="Marca *"
            value={formData.marca}
            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
            required
          />
          <Input
            label="Modelo *"
            value={formData.modelo}
            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
            required
          />
          
          {/* CARACTERÍSTICAS */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Características</h3>
          </div>

          <Select
            label="Tipo Combustible *"
            options={TIPOS_COMBUSTIBLE.map(t => ({ id: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            value={formData.tipo_combustible}
            onChange={(e) => setFormData({ ...formData, tipo_combustible: e.target.value })}
            required
          />
          
          <Input
            label="Color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="Ej: Blanco, Azul"
          />
          
          <Input
            label="Año Fabricación *"
            type="number"
            value={formData.anio}
            onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) || '' })}
            required
            min={1980}
            max={new Date().getFullYear() + 1}
          />
          <Input
            label="Capacidad Pasajeros *"
            type="number"
            value={formData.capacidad_pasajeros}
            onChange={(e) => setFormData({ ...formData, capacidad_pasajeros: parseInt(e.target.value) || '' })}
            required
            min={1}
            max={100}
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
            label="Estado *"
            options={ESTADOS_BUS.map(e => ({ id: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))}
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            required
          />
          
          {/* KILOMETRAJE */}
          <Input
            label="Km Original"
            type="number"
            value={formData.kilometraje_original}
            onChange={(e) => setFormData({ ...formData, kilometraje_original: parseInt(e.target.value) || 0 })}
            min={0}
          />
          <Input
            label="Km Actual"
            type="number"
            value={formData.kilometraje_actual}
            onChange={(e) => setFormData({ ...formData, kilometraje_actual: parseInt(e.target.value) || 0 })}
            min={0}
          />
          
          {/* REVISIÓN TÉCNICA */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Revisión Técnica</h3>
          </div>

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
          
          {/* SOAP */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">SOAP (Seguro Obligatorio)</h3>
          </div>
          
          <Input
            label="Número SOAP *"
            value={formData.numero_soap}
            onChange={(e) => setFormData({ ...formData, numero_soap: e.target.value })}
            required
            placeholder="Número del SOAP"
          />
          <Input
            label="Vencimiento SOAP *"
            type="date"
            value={formData.vencimiento_soap}
            onChange={(e) => setFormData({ ...formData, vencimiento_soap: e.target.value })}
            required
          />
          
          {/* COBERTURA ADICIONAL */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Cobertura Adicional (Opcional)</h3>
          </div>
          
          <Select
            label="Tipo Cobertura"
            options={TIPOS_COBERTURA.map(t => ({ 
              id: t, 
              label: t === 'ninguna' ? 'Ninguna / Solo SOAP' : 
                     t === 'terceros' ? 'Responsabilidad Civil a Terceros' : 
                     'Cobertura Full / Todo Riesgo'
            }))}
            value={formData.tipo_cobertura_adicional}
            onChange={(e) => setFormData({ ...formData, tipo_cobertura_adicional: e.target.value })}
          />
          
          <Input
            label="Compañía Seguro"
            value={formData.compania_seguro}
            onChange={(e) => setFormData({ ...formData, compania_seguro: e.target.value })}
            placeholder="Ej: Mapfre, HDI, Sura"
          />
          
          <Input
            label="Número Póliza"
            value={formData.numero_poliza}
            onChange={(e) => setFormData({ ...formData, numero_poliza: e.target.value })}
            placeholder="Número de póliza"
          />
          
          <Input
            label="Vencimiento Póliza"
            type="date"
            value={formData.vencimiento_poliza}
            onChange={(e) => setFormData({ ...formData, vencimiento_poliza: e.target.value })}
          />
          
          {/* OTROS */}
          <Input
            label="Permiso Circulación"
            value={formData.numero_permiso_circulacion}
            onChange={(e) => setFormData({ ...formData, numero_permiso_circulacion: e.target.value })}
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Notas adicionales sobre el bus..."
          />
        </div>
      </FormDialog>
    </div>
  );
}