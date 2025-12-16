import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Filter, X, Eye, ChevronDown, ChevronUp, Search,
  Edit2, Trash2, Bus, AlertCircle, Fuel, Calendar
} from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchBuses, createBus, updateBus, deleteBus } from '../services/api';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import { useNotifications } from '../context/NotificationContext';

const ESTADOS_BUS = ['operativo', 'mantenimiento', 'desmantelado'];
const TIPOS_COMBUSTIBLE = ['diesel', 'gasolina', 'gas', 'eléctrico', 'híbrido'];
const TIPOS_COBERTURA = ['ninguna', 'terceros', 'full'];

// corregido: valor que viaja al backend debe ser 'doble_piso'
const TIPOS_BUS = ['simple', 'doble_piso'];
const CANTIDAD_EJES = ['2', '3', '4'];
const UBICACION_MOTOR = ['delantero', 'trasero', 'central'];

// 📄 Agregar constante de tipos de servicio
const TIPOS_SERVICIO = [
  { id: 'clasico', label: 'Clásico (1.0x)', factor: 1.0 },
  { id: 'semicama', label: 'Semicama (1.4x)', factor: 1.4 },
  { id: 'cama', label: 'Cama (2.0x)', factor: 2.0 },
  { id: 'premium', label: 'Premium (3.0x)', factor: 3.0 }
];

// --- UTILIDADES DE FECHAS ---

// 1. Formatear fecha para mostrar en tabla (DD/MM/AAAA)
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
};

// 2. Semáforo de Vencimientos
const getExpirationStyle = (dateString) => {
  if (!dateString) return 'text-gray-600';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const expirationDate = new Date(year, month - 1, day);
  
  const diffTime = expirationDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded border border-red-200';
  if (diffDays <= 10) return 'text-red-600 font-bold animate-pulse';
  if (diffDays <= 20) return 'text-amber-500 font-bold';
  
  return 'text-emerald-600 font-medium';
};

export default function BusesPage() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  
  const [searchPatente, setSearchPatente] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [filterAnio, setFilterAnio] = useState('');
  const [filterCombustible, setFilterCombustible] = useState('');
  const [filterPasajeros, setFilterPasajeros] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  // Línea 69: Agregar filtro
  const [filterTipoServicio, setFilterTipoServicio] = useState(''); 

  const opcionesMarcas = useMemo(() => {
    return [...new Set(buses.map(b => b.marca).filter(Boolean))].sort();
  }, [buses]);

  const opcionesAnios = useMemo(() => {
    return [...new Set(buses.map(b => b.anio).filter(Boolean))].sort((a, b) => b - a);
  }, [buses]);

  const opcionesPasajeros = useMemo(() => {
    return [...new Set(buses.map(b => b.capacidad_pasajeros).filter(Boolean))].sort((a, b) => a - b);
  }, [buses]);

  const { addNotification } = useNotifications();

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
    numero_chasis: '',
    capacidad_pasajeros: '',
    fecha_adquisicion: '',
    estado: 'operativo',
    tipo_bus: 'simple',
    cantidad_ejes: '2',
    // Línea 100: Agregar al formData inicial
    tipo_servicio: 'clasico',
    marca_motor: '',
    modelo_motor: '',
    ubicacion_motor: 'trasero',
    marca_chasis: '',
    modelo_chasis: '',
    marca_carroceria: '',
    modelo_carroceria: '',
    proximo_mantenimiento_km: '',
    fecha_ultimo_mantenimiento: '',
    fecha_proximo_mantenimiento: '',
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
  });

  useEffect(() => {
    loadBuses();
  }, []);

  useEffect(() => {
    let data = buses;

    if (searchPatente) {
      const term = searchPatente.toLowerCase().trim();
      data = data.filter(b => b.patente.toLowerCase().includes(term));
    }
    if (filterMarca) {
      data = data.filter(b => b.marca === filterMarca);
    }
    if (filterAnio) {
      data = data.filter(b => b.anio.toString() === filterAnio.toString());
    }
    if (filterCombustible) {
      data = data.filter(b => b.tipo_combustible === filterCombustible);
    }
    if (filterPasajeros) {
      data = data.filter(b => b.capacidad_pasajeros.toString() === filterPasajeros.toString());
    }
    if (filterEstado) {
      data = data.filter(b => b.estado_visual === filterEstado);
    }
    // Líneas 150-152: Agregar al filtro useEffect
    if (filterTipoServicio) {
      data = data.filter(b => b.tipo_servicio === filterTipoServicio);
    }

    setFilteredBuses(data);
    setCurrentPage(1); 
  // Línea 156: Actualizar dependencias del useEffect
  }, [buses, searchPatente, filterMarca, filterAnio, filterCombustible, filterPasajeros, filterEstado, filterTipoServicio]);

  const sortedData = [...filteredBuses].sort((a, b) => b.id - a.id);
  const { currentPage, setCurrentPage, totalPages, paginatedData } = usePagination(sortedData, 10);

  const loadBuses = async () => {
    try {
      setLoading(true);
      const data = await fetchBuses();
      setBuses(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar buses: ' + err.message);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de los buses.');
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatenteChange = (value) => {
    let clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    setFormData({ ...formData, patente: clean });
  };

  const formatPatente = (patente) => {
    if (!patente || patente.length !== 6) return patente;
    return `${patente.substring(0, 2)}·${patente.substring(2, 4)}·${patente.substring(4, 6)}`;
  };

  const handleOpenDialog = (bus = null) => {
    if (bus) {
      setEditingBus(bus);
      setFormData({
        ...bus,
        fecha_adquisicion: bus.fecha_adquisicion ? bus.fecha_adquisicion.split('T')[0] : '',
        proxima_revision_tecnica: bus.proxima_revision_tecnica ? bus.proxima_revision_tecnica.split('T')[0] : '',
        ultima_revision_tecnica: bus.ultima_revision_tecnica ? bus.ultima_revision_tecnica.split('T')[0] : '',
        vencimiento_soap: bus.vencimiento_soap ? bus.vencimiento_soap.split('T')[0] : '',
        vencimiento_poliza: bus.vencimiento_poliza ? bus.vencimiento_poliza.split('T')[0] : '',
        fecha_ultimo_mantenimiento: bus.fecha_ultimo_mantenimiento ? bus.fecha_ultimo_mantenimiento.split('T')[0] : '',
        fecha_proximo_mantenimiento: bus.fecha_proximo_mantenimiento ? bus.fecha_proximo_mantenimiento.split('T')[0] : '',
      });
    } else {
      setEditingBus(null);
      setFormData({
        patente: '', patente_verificador: '', marca: '', modelo: '', tipo_combustible: 'diesel',
        color: '', anio: '', numero_serie: '', numero_motor: '', numero_chasis: '',
        capacidad_pasajeros: '', fecha_adquisicion: '', estado: 'operativo', tipo_bus: 'simple',
        // Línea 202: Agregar tipo_servicio al reset del form
        cantidad_ejes: '2', tipo_servicio: 'clasico', marca_motor: '', modelo_motor: '', ubicacion_motor: 'trasero',
        marca_chasis: '', modelo_chasis: '', marca_carroceria: '', modelo_carroceria: '',
        proximo_mantenimiento_km: '', fecha_ultimo_mantenimiento: '', fecha_proximo_mantenimiento: '',
        proxima_revision_tecnica: '', ultima_revision_tecnica: '', documento_revision_tecnica: '',
        numero_soap: '', vencimiento_soap: '', compania_seguro: '', numero_poliza: '',
        tipo_cobertura_adicional: 'ninguna', vencimiento_poliza: '', numero_permiso_circulacion: '',
        observaciones: '', kilometraje_original: '',
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
        addNotification('success', 'Bus Actualizado', `La unidad patente ${formatPatente(formData.patente)} ha sido actualizada.`);
      } else {
        await createBus(formData);
        addNotification('success', 'Bus Creado', `La nueva unidad patente ${formatPatente(formData.patente)} ha sido registrada.`);
      }
      loadBuses();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      addNotification('error', 'Error', 'No se pudo guardar el bus.');
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este bus?')) {
      try {
        await deleteBus(id);
        addNotification('warning', 'Bus Eliminado', 'El registro del bus ha sido eliminado.');
        loadBuses();
        setError(null);
      } catch (err) {
        addNotification('error', 'Error', 'No se pudo eliminar el bus.');
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const handleClearAllFilters = () => {
    setSearchPatente('');
    setFilterMarca('');
    setFilterAnio('');
    setFilterCombustible('');
    setFilterPasajeros('');
    setFilterEstado('');
    // Línea 258: Agregar al clear filters
    setFilterTipoServicio('');
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
    const labels = { 'ninguna': 'Solo SOAP', 'terceros': 'Terceros', 'full': 'Full' };
    return labels[tipo] || tipo;
  };

  // Líneas 275-283: Agregar función helper
  const getTipoServicioInfo = (tipo) => {
    const info = {
      'clasico': { label: 'Clásico', color: 'bg-gray-100 text-gray-800', factor: '1.0x' },
      'semicama': { label: 'Semicama', color: 'bg-blue-100 text-blue-800', factor: '1.4x' },
      'cama': { label: 'Cama', color: 'bg-purple-100 text-purple-800', factor: '2.0x' },
      'premium': { label: 'Premium', color: 'bg-amber-100 text-amber-800', factor: '3.0x' }
    };
    return info[tipo] || { label: tipo, color: 'bg-gray-100 text-gray-800', factor: '1.0x' };
  };

  const renderBusesTable = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Patente</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Marca</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Modelo</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Año</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Combustible</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Capacidad</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Tipo Servicio</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              // Línea 302: Cambiar colspan
              <tr><td colSpan="9" className="px-6 py-8 text-center text-gray-500">No se encontraron buses con los filtros seleccionados</td></tr>
            ) : (
              // Líneas 304-306: Agregar dentro del map
              paginatedData.map((bus) => {
                const tipoServicioInfo = getTipoServicioInfo(bus.tipo_servicio);
                return (
                <React.Fragment key={bus.id}>
                  <tr 
                    className="hover:bg-gray-100 transition-colors even:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === bus.id ? null : bus.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-600 text-sm">{formatPatente(bus.patente)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{bus.marca}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{bus.modelo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{bus.anio}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{bus.tipo_combustible}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{bus.capacidad_pasajeros} pasajeros</td>
                    
                    {/* Líneas 317-321: Agregar celda de tipo servicio */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${tipoServicioInfo.color}`}>
                        {tipoServicioInfo.label} {tipoServicioInfo.factor}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoColor(bus.estado_visual)}`}>
                        {bus.estado_visual}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenDialog(bus)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors font-medium"
                          title="Editar"
                        >
                          <Edit2 size={16} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(bus.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors font-medium"
                          title="Eliminar"
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                        <button
                          onClick={() => setExpandedRow(expandedRow === bus.id ? null : bus.id)}
                          className="flex items-center justify-center w-9 h-9 bg-gray-100 text-gray-600 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors ml-1"
                          title="Ver detalles"
                        >
                          {expandedRow === bus.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedRow === bus.id && (
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {/* Línea 343: Cambiar colspan expandido */}
                      <td colSpan="9" className="px-6 py-6 cursor-default">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
                          
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2"><Bus size={16}/> Identificación</h4>
                            <p><span className="text-gray-500">Verificador:</span> {bus.patente_verificador || '-'}</p>
                            <p><span className="text-gray-500">Tipo:</span> {bus.tipo_bus === 'simple' ? 'Simple (1 Piso)' : 'Doble Piso'}</p>
                            <p><span className="text-gray-500">Ejes:</span> {bus.cantidad_ejes}</p>
                            {/* Líneas 351-355: Agregar en detalles expandidos */}
                            <p><span className="text-gray-500">Servicio:</span>
                              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${tipoServicioInfo.color}`}>
                                {tipoServicioInfo.label} ({tipoServicioInfo.factor})
                              </span>
                            </p>
                            <p><span className="text-gray-500">N° Serie:</span> {bus.numero_serie}</p>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2"><Fuel size={16}/> Ficha Técnica</h4>
                            <p><span className="text-gray-500">Motor:</span> {bus.marca_motor} {bus.modelo_motor}</p>
                            <p><span className="text-gray-500">Chasis:</span> {bus.marca_chasis} {bus.modelo_chasis}</p>
                            <p><span className="text-gray-500">Carrocería:</span> {bus.marca_carroceria} {bus.modelo_carroceria}</p>
                            <p><span className="text-gray-500">Ubicación Motor:</span> {bus.ubicacion_motor}</p>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2"><Calendar size={16}/> Operación</h4>
                            <p><span className="text-gray-500">Adquisición:</span> {formatDate(bus.fecha_adquisicion)}</p>
                            <p><span className="text-gray-500">Km Original:</span> {((bus.kilometraje_original || 0)).toLocaleString()} km</p>
                            <p><span className="text-gray-500">Mantención:</span> Cada {bus.proximo_mantenimiento_km?.toLocaleString()} km</p>
                            <p><span className="text-gray-500">Prox. Mantención:</span> {formatDate(bus.fecha_proximo_mantenimiento)}</p>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2"><AlertCircle size={16}/> Documentos</h4>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Rev. Técnica:</span>
                                <span className={getExpirationStyle(bus.proxima_revision_tecnica)}>
                                    {formatDate(bus.proxima_revision_tecnica)}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">SOAP:</span>
                                <span className={getExpirationStyle(bus.vencimiento_soap)}>
                                    {formatDate(bus.vencimiento_soap)}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Seguro:</span>
                                {bus.tipo_cobertura_adicional !== 'ninguna' ? (
                                    <span className={getExpirationStyle(bus.vencimiento_poliza)}>
                                        {formatDate(bus.vencimiento_poliza)}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">Solo SOAP</span>
                                )}
                            </div>
                            
                            <p className="text-xs text-gray-400 mt-1 text-right">{getCoberturaLabel(bus.tipo_cobertura_adicional)}</p>

                            {bus.observaciones && (
                              <div className="mt-2 p-2 bg-white border border-gray-200 rounded text-xs text-gray-600 italic">
                                {bus.observaciones}
                              </div>
                            )}
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                // Línea 412: Cerrar map correctamente
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Buses</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Administra la flota de buses de la empresa.</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Nuevo Bus
          </Button>
        </div>
        <Bus className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={18} /></button>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col space-y-4">
          
          <div className="w-full relative">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Buscar Patente</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Ingrese patente..."
                value={searchPatente}
                onChange={(e) => setSearchPatente(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono uppercase"
              />
            </div>
          </div>

          {/* Línea 466: Cambiar grid cols */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Marca</label>
              <select
                value={filterMarca}
                onChange={(e) => setFilterMarca(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700 cursor-pointer"
              >
                <option value="">Todas</option>
                {opcionesMarcas.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Año</label>
              <select
                value={filterAnio}
                onChange={(e) => setFilterAnio(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700 cursor-pointer"
              >
                <option value="">Todos</option>
                {opcionesAnios.map(anio => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Combustible</label>
              <select
                value={filterCombustible}
                onChange={(e) => setFilterCombustible(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700 cursor-pointer capitalize"
              >
                <option value="">Todos</option>
                {TIPOS_COMBUSTIBLE.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Capacidad</label>
              <select
                value={filterPasajeros}
                onChange={(e) => setFilterPasajeros(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700 cursor-pointer"
              >
                <option value="">Todas</option>
                {opcionesPasajeros.map(cap => (
                  <option key={cap} value={cap}>{cap} pax</option>
                ))}
              </select>
            </div>

            {/* Líneas 524-536: Agregar filtro dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tipo Servicio</label>
              <select 
                value={filterTipoServicio} 
                onChange={(e) => setFilterTipoServicio(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700 cursor-pointer"
              >
                <option value="">Todos</option>
                {TIPOS_SERVICIO.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              {/* Línea 539: Actualizar condición clear filters */}
              {(searchPatente || filterMarca || filterAnio || filterCombustible || filterPasajeros || filterEstado || filterTipoServicio) && (
                <button 
                  onClick={handleClearAllFilters}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg transition-colors text-sm font-medium h-[38px]"
                >
                  <Filter size={16} />
                  Limpiar
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : (
        renderBusesTable()
      )}

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <FormDialog
        isOpen={openDialog}
        title={editingBus ? 'Editar Bus' : 'Nuevo Bus'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Identificación del Vehículo</h3>
          </div>

          <Input label="Patente *" value={formData.patente} onChange={(e) => handlePatenteChange(e.target.value)} required placeholder="ABCD12" maxLength={6} helpText="4 letras y 2 números" />
          <Input label="Dígito Verificador" value={formData.patente_verificador} onChange={(e) => setFormData({ ...formData, patente_verificador: e.target.value.toUpperCase() })} maxLength={1} placeholder="Ej: 5" />
          <Input label="Marca *" value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} required />
          <Input label="Modelo *" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} required />
          
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
          <Select
            label="Tipo Bus *"
            options={TIPOS_BUS.map(t => ({
              id: t,
              label: t === 'simple' ? 'Simple (1 Piso)' : 'Doble Piso',
            }))}
            value={formData.tipo_bus}
            onChange={(e) => setFormData({ ...formData, tipo_bus: e.target.value })}
            required
          />
          <Select
            label="Cantidad Ejes *"
            options={CANTIDAD_EJES.map(e => ({ id: e, label: `${e} ejes` }))}
            value={formData.cantidad_ejes}
            onChange={(e) => setFormData({ ...formData, cantidad_ejes: e.target.value })}
            required
          />
          
          {/* Líneas 596-602: Agregar selector en formulario */}
          <Select
            label="Tipo Servicio *"
            options={TIPOS_SERVICIO.map(t => ({ id: t.id, label: t.label }))}
            value={formData.tipo_servicio}
            onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value })}
            required
          />
          
          <Input label="Año Fabricación *" type="number" value={formData.anio} onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) || '' })} required min={1980} max={new Date().getFullYear() + 1} />
          <Input label="Capacidad Pasajeros *" type="number" value={formData.capacidad_pasajeros} onChange={(e) => setFormData({ ...formData, capacidad_pasajeros: parseInt(e.target.value) || '' })} required min={1} max={100} />
          <Input label="Número Serie" value={formData.numero_serie} onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })} />

          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Motor</h3>
          </div>
          <Input label="Marca Motor" value={formData.marca_motor} onChange={(e) => setFormData({ ...formData, marca_motor: e.target.value })} placeholder="Ej: Mercedes-Benz, Cummins" />
          <Input label="Modelo Motor" value={formData.modelo_motor} onChange={(e) => setFormData({ ...formData, modelo_motor: e.target.value })} placeholder="Ej: OM-457, ISB 6.7" />
          <Select
            label="Ubicación Motor"
            options={UBICACION_MOTOR.map(u => ({ id: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))}
            value={formData.ubicacion_motor}
            onChange={(e) => setFormData({ ...formData, ubicacion_motor: e.target.value })}
          />
          <Input label="Número Motor" value={formData.numero_motor} onChange={(e) => setFormData({ ...formData, numero_motor: e.target.value })} />

          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Chasis</h3>
          </div>
          <Input label="Marca Chasis" value={formData.marca_chasis} onChange={(e) => setFormData({ ...formData, marca_chasis: e.target.value })} placeholder="Ej: Mercedes-Benz, Volvo" />
          <Input label="Modelo Chasis" value={formData.modelo_chasis} onChange={(e) => setFormData({ ...formData, modelo_chasis: e.target.value })} placeholder="Ej: OF-1721, B270F" />
          <Input label="Número Chasis (VIN)" value={formData.numero_chasis} onChange={(e) => setFormData({ ...formData, numero_chasis: e.target.value })} />
          <div></div>

          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Carrocería</h3>
          </div>
          <Input label="Marca Carrocería" value={formData.marca_carroceria} onChange={(e) => setFormData({ ...formData, marca_carroceria: e.target.value })} placeholder="Ej: Marcopolo, Caio" />
          <Input label="Modelo Carrocería" value={formData.modelo_carroceria} onChange={(e) => setFormData({ ...formData, modelo_carroceria: e.target.value })} placeholder="Ej: Paradiso, Apache" />

          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Estado y Operación</h3>
          </div>

          <Input label="Fecha Adquisición" type="date" value={formData.fecha_adquisicion} onChange={(e) => setFormData({ ...formData, fecha_adquisicion: e.target.value })} />
          <Select
            label="Estado *"
            options={ESTADOS_BUS.map(e => ({ id: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))}
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            required
          />
          <Input label="Km Original" type="number" value={formData.kilometraje_original} onChange={(e) => setFormData({ ...formData, kilometraje_original: parseInt(e.target.value) || 0 })} min={0} />

          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Mantenimiento</h3>
          </div>
          <Input label="Mantenimiento cada (km)" type="number" value={formData.proximo_mantenimiento_km} onChange={(e) => setFormData({ ...formData, proximo_mantenimiento_km: parseInt(e.target.value) || '' })} placeholder="Ej: 10000" helpText="Cada cuántos km requiere mantenimiento" min={0} />
          <Input label="Último Mantenimiento" type="date" value={formData.fecha_ultimo_mantenimiento} onChange={(e) => setFormData({ ...formData, fecha_ultimo_mantenimiento: e.target.value })} />
          <Input label="Próximo Mantenimiento" type="date" value={formData.fecha_proximo_mantenimiento} onChange={(e) => setFormData({ ...formData, fecha_proximo_mantenimiento: e.target.value })} helpText="Para alertas en dashboard" />
          <div></div>
          
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Revisión Técnica</h3>
          </div>
          <Input label="Última Revisión Técnica" type="date" value={formData.ultima_revision_tecnica} onChange={(e) => setFormData({ ...formData, ultima_revision_tecnica: e.target.value })} />
          <Input label="Próxima Revisión Técnica" type="date" value={formData.proxima_revision_tecnica} onChange={(e) => setFormData({ ...formData, proxima_revision_tecnica: e.target.value })} />
          
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">SOAP (Seguro Obligatorio)</h3>
          </div>
          <Input label="Número SOAP *" value={formData.numero_soap} onChange={(e) => setFormData({ ...formData, numero_soap: e.target.value })} required placeholder="Número del SOAP" />
          <Input label="Vencimiento SOAP *" type="date" value={formData.vencimiento_soap} onChange={(e) => setFormData({ ...formData, vencimiento_soap: e.target.value })} required />
          
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Cobertura Adicional (Opcional)</h3>
          </div>
          <Select
            label="Tipo Cobertura"
            options={TIPOS_COBERTURA.map(t => ({
              id: t,
              label:
                t === 'ninguna'
                  ? 'Ninguna / Solo SOAP'
                  : t === 'terceros'
                  ? 'Responsabilidad Civil a Terceros'
                  : 'Cobertura Full / Todo Riesgo',
            }))}
            value={formData.tipo_cobertura_adicional}
            onChange={(e) => setFormData({ ...formData, tipo_cobertura_adicional: e.target.value })}
          />
          <Input label="Compañía Seguro" value={formData.compania_seguro} onChange={(e) => setFormData({ ...formData, compania_seguro: e.target.value })} placeholder="Ej: Mapfre, HDI, Sura" />
          <Input label="Número Póliza" value={formData.numero_poliza} onChange={(e) => setFormData({ ...formData, numero_poliza: e.target.value })} placeholder="Número de póliza" />
          <Input label="Vencimiento Póliza" type="date" value={formData.vencimiento_poliza} onChange={(e) => setFormData({ ...formData, vencimiento_poliza: e.target.value })} />
          <Input label="Permiso Circulación" value={formData.numero_permiso_circulacion} onChange={(e) => setFormData({ ...formData, numero_permiso_circulacion: e.target.value })} />
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
