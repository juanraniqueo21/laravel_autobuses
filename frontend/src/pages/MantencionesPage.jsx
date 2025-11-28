import React, { useState, useEffect } from 'react';
import { Plus, Wrench, AlertCircle } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { 
  fetchBuses, 
  fetchEmpleados, 
  fetchMantenimientos,
  fetchTurnos,
  createMantenimiento, 
  updateMantenimiento, 
  deleteMantenimiento 
} from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';

const TIPOS_MANTENIMIENTO = ['preventivo', 'correctivo', 'revision'];
const ESTADOS_MANTENIMIENTO = ['en_proceso', 'completado', 'cancelado'];

export default function MantencionesPage() {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [buses, setBuses] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState(null);
  
  // Estados para selección múltiple
  const [selectedBuses, setSelectedBuses] = useState([]);
  
  const { addNotification } = useNotifications();

  const [formData, setFormData] = useState({
    bus_id: '', // Para edición individual
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
      const [busesData, empleadosData, mantenimientosData, turnosData] = await Promise.all([
        fetchBuses(),
        fetchEmpleados(),
        fetchMantenimientos(),
        fetchTurnos(),
      ]);
      
      setBuses(busesData);
      setTurnos(turnosData);

      // Filtrar solo mecánicos activos
      const mechanics = empleadosData.filter(emp =>
        emp.mecanico &&
        emp.mecanico.estado === 'activo' &&
        emp.estado === 'activo'
      );

      setMecanicos(mechanics);
      setMantenimientos(mantenimientosData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de mantenimiento.');
    } finally {
      setLoading(false);
    }
  };

  // Verificar si un bus tiene turnos en el rango de fechas
  const busTieneTurnos = (busId, fechaInicio, fechaTermino) => {
    if (!fechaInicio) return false;
    
    const fechaFin = fechaTermino || fechaInicio;
    
    return turnos.some(turno => {
      if (turno.bus_id !== busId) return false;
      if (turno.estado === 'cancelado') return false;
      
      const fechaTurno = turno.fecha_turno.split('T')[0];
      return fechaTurno >= fechaInicio && fechaTurno <= fechaFin;
    });
  };

  // Verificar si un mecánico está ocupado en el rango de fechas
  const mecanicoEstaOcupado = (mecanicoId, fechaInicio, fechaTermino) => {
    if (!fechaInicio) return false;
    
    const fechaFin = fechaTermino || fechaInicio;
    
    return mantenimientos.some(mant => {
      if (mant.mecanico_id !== mecanicoId) return false;
      if (mant.estado !== 'en_proceso') return false;
      if (editingMantenimiento && mant.id === editingMantenimiento.id) return false;
      
      // Verificar solapamiento de fechas
      const mantInicio = mant.fecha_inicio;
      const mantFin = mant.fecha_termino || mant.fecha_inicio;
      
      return !(fechaFin < mantInicio || fechaInicio > mantFin);
    });
  };

  // Obtener buses disponibles
  const getBusesDisponibles = () => {
    return buses.map(bus => {
      const tieneTurnos = busTieneTurnos(bus.id, formData.fecha_inicio, formData.fecha_termino);
      const estaEnMantenimiento = bus.estado === 'mantenimiento';
      
      return {
        ...bus,
        tieneTurnos,
        estaEnMantenimiento,
        disponible: !tieneTurnos && !estaEnMantenimiento
      };
    });
  };

  // Obtener mecánicos disponibles
  const getMecanicosDisponibles = () => {
    return mecanicos.filter(mec => {
      return !mecanicoEstaOcupado(mec.mecanico.id, formData.fecha_inicio, formData.fecha_termino);
    });
  };

  const sortedMantenimientos = [...mantenimientos].sort((a, b) => b.id - a.id);
  const { currentPage, setCurrentPage, totalPages, paginatedData } = usePagination(sortedMantenimientos, 10);

  const handleOpenDialog = (mantenimiento = null) => {
    if (mantenimiento) {
      // Modo edición: un solo bus
      setEditingMantenimiento(mantenimiento);
      setSelectedBuses([]);
      setFormData({
        bus_id: mantenimiento.bus_id,
        mecanico_id: mantenimiento.mecanico_id,
        tipo_mantenimiento: mantenimiento.tipo_mantenimiento,
        descripcion: mantenimiento.descripcion,
        fecha_inicio: mantenimiento.fecha_inicio,
        fecha_termino: mantenimiento.fecha_termino || '',
        costo_total: mantenimiento.costo_total || '',
        estado: mantenimiento.estado,
        repuestos_utilizados: Array.isArray(mantenimiento.repuestos_utilizados) 
          ? mantenimiento.repuestos_utilizados.join(', ') 
          : mantenimiento.repuestos_utilizados || '',
        observaciones: mantenimiento.observaciones || '',
      });
    } else {
      // Modo creación: selección múltiple
      setEditingMantenimiento(null);
      setSelectedBuses([]);
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
    setSelectedBuses([]);
  };

  const handleBusToggle = (busId) => {
    setSelectedBuses(prev => {
      if (prev.includes(busId)) {
        return prev.filter(id => id !== busId);
      } else {
        return [...prev, busId];
      }
    });
  };

  const handleSelectAllBuses = () => {
    const busesDisponibles = getBusesDisponibles().filter(b => b.disponible);
    const todosSeleccionados = busesDisponibles.every(b => selectedBuses.includes(b.id));
    
    if (todosSeleccionados) {
      setSelectedBuses([]);
    } else {
      setSelectedBuses(busesDisponibles.map(b => b.id));
    }
  };

  const handleSave = async () => {
    try {
      if (editingMantenimiento) {
        // Modo edición: actualizar un solo mantenimiento
        await updateMantenimiento(editingMantenimiento.id, formData);
        addNotification('success', 'Mantenimiento Actualizado', 'El registro ha sido modificado correctamente.');
      } else {
        // Modo creación: crear múltiples mantenimientos
        if (selectedBuses.length === 0) {
          setError('Debe seleccionar al menos un bus');
          return;
        }

        const payload = {
          ...formData,
          bus_ids: selectedBuses
        };

        const response = await createMantenimiento(payload);
        
        if (response.errores && response.errores.length > 0) {
          addNotification('warning', 'Advertencia', response.message + '. Algunos buses no pudieron ser procesados.');
        } else {
          addNotification('success', 'Mantenimiento Creado', response.message || 'Mantenimientos creados exitosamente.');
        }
      }
      
      loadData();
      handleCloseDialog();
    } catch (err) {
      addNotification('error', 'Error', err.message || 'No se pudo guardar el registro.');
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este mantenimiento?')) {
      try {
        await deleteMantenimiento(id);
        addNotification('warning', 'Mantenimiento Eliminado', 'El registro ha sido eliminado.');
        loadData();
      } catch (err) {
        addNotification('error', 'Error', 'No se pudo eliminar el registro.');
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

  const busesDisponibles = getBusesDisponibles();
  const mecanicosDisponibles = getMecanicosDisponibles();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Mantenimiento</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Control de reparaciones y servicios de flota.</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Nuevo Mantenimiento
          </Button>
        </div>
        <Wrench className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
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
        data={paginatedData}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingMantenimiento ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
        size="large"
      >
        {/* SELECCIÓN DE BUSES */}
        {!editingMantenimiento ? (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Seleccionar Buses * ({selectedBuses.length} seleccionados)
              </label>
              <button
                type="button"
                onClick={handleSelectAllBuses}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {busesDisponibles.filter(b => b.disponible).every(b => selectedBuses.includes(b.id))
                  ? 'Deseleccionar todos'
                  : 'Seleccionar todos disponibles'}
              </button>
            </div>
            
            <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
              {busesDisponibles.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No hay buses registrados</div>
              ) : (
                busesDisponibles.map(bus => {
                  const isSelected = selectedBuses.includes(bus.id);
                  const isDisabled = !bus.disponible;
                  
                  return (
                    <div
                      key={bus.id}
                      className={`p-3 border-b last:border-b-0 hover:bg-gray-50 transition ${
                        isDisabled ? 'bg-gray-100 opacity-60' : ''
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleBusToggle(bus.id)}
                          disabled={isDisabled}
                          className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {bus.patente}
                            </span>
                            <span className="text-sm text-gray-600">
                              - {bus.marca} {bus.modelo}
                            </span>
                          </div>
                          
                          {bus.tieneTurnos && (
                            <div className="flex items-center gap-1 text-xs text-amber-700 mt-1">
                              <AlertCircle size={12} />
                              <span>Tiene turnos programados en estas fechas</span>
                            </div>
                          )}
                          
                          {bus.estaEnMantenimiento && (
                            <div className="flex items-center gap-1 text-xs text-red-700 mt-1">
                              <AlertCircle size={12} />
                              <span>Ya está en mantenimiento</span>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
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
        )}

        {/* Fechas - Primero para que se usen en validaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="Fecha de Inicio *"
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

        {/* MECÁNICO - Solo disponibles */}
        <Select
          label="Mecánico *"
          options={[
            { id: '', label: 'Seleccione un mecánico' },
            ...mecanicosDisponibles.map(mec => ({
              id: mec.mecanico.id,
              label: `${mec.user?.nombre} ${mec.user?.apellido} - ${mec.mecanico.especialidad || 'Sin especialidad'}`
            }))
          ]}
          value={formData.mecanico_id}
          onChange={(e) => setFormData({ ...formData, mecanico_id: e.target.value })}
          required
        />

        <Select
          label="Tipo de Mantenimiento *"
          options={TIPOS_MANTENIMIENTO.map(t => ({ id: t, label: t }))}
          value={formData.tipo_mantenimiento}
          onChange={(e) => setFormData({ ...formData, tipo_mantenimiento: e.target.value })}
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <Input
          label="Costo Total (CLP)"
          type="number"
          value={formData.costo_total}
          onChange={(e) => setFormData({ ...formData, costo_total: e.target.value })}
        />

        <Select
          label="Estado *"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Ej: Aceite 5W30, Filtro aire, etc. (separados por coma)"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>
      </FormDialog>
    </div>
  );
}