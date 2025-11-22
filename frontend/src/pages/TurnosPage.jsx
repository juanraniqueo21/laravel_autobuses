import React, { useState, useEffect } from 'react';
import { Plus, Filter, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Eye, Edit2, Trash2 } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import FormDialog from '../components/forms/FormDialog';
import { 
  fetchTurnos, 
  createTurno, 
  updateTurno, 
  deleteTurno,
  fetchBuses,
  fetchConductores,
  fetchAsistentes 
} from '../services/api';

const TIPOS_TURNO = ['mañana', 'tarde', 'noche', 'completo'];
const ESTADOS_TURNO = ['programado', 'en_curso', 'completado', 'cancelado'];
const ROLES_CONDUCTOR = ['principal', 'apoyo'];
const POSICIONES_ASISTENTE = ['piso_superior', 'piso_inferior', 'general'];

export default function TurnosPage() {
  // Estados principales
  const [turnos, setTurnos] = useState([]);
  const [buses, setBuses] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [asistentes, setAsistentes] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estados del calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Estados del modal
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTurno, setEditingTurno] = useState(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    bus_id: '',
    fecha_turno: '',
    hora_inicio: '',
    hora_termino: '',
    tipo_turno: 'mañana',
    estado: 'programado',
    observaciones: '',
  });
  
  // Conductores y asistentes dinámicos
  const [formConductores, setFormConductores] = useState([{ conductor_id: '', rol: 'principal' }]);
  const [formAsistentes, setFormAsistentes] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar turnos cuando cambia el mes
  useEffect(() => {
    loadTurnos();
  }, [currentDate]);

  // Auto-ocultar mensajes
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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [busesData, conductoresData, asistentesData] = await Promise.all([
        fetchBuses(),
        fetchConductores(),
        fetchAsistentes()
      ]);
      
      setBuses(Array.isArray(busesData) ? busesData : []);
      setConductores(Array.isArray(conductoresData) ? conductoresData : []);
      setAsistentes(Array.isArray(asistentesData) ? asistentesData : []);
      
      await loadTurnos();
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTurnos = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const filters = {
        fecha_inicio: `${year}-${String(month).padStart(2, '0')}-01`,
        fecha_fin: new Date(year, month, 0).toISOString().split('T')[0]
      };
      
      const data = await fetchTurnos(filters);
      setTurnos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar turnos:', err);
      setTurnos([]);
    }
  };

  // Funciones de calendario
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getTurnosForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return turnos.filter(t => t.fecha_turno.split('T')[0] === dateStr);
  };

  const changeMonth = (increment) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Funciones del formulario
  const handleOpenDialog = (turno = null, date = null) => {
    if (turno) {
      // Editar turno existente
      setEditingTurno(turno);
      setFormData({
        bus_id: turno.bus?.id || turno.bus_id,
        fecha_turno: turno.fecha_turno.split('T')[0],
        hora_inicio: turno.hora_inicio,
        hora_termino: turno.hora_termino,
        tipo_turno: turno.tipo_turno,
        estado: turno.estado,
        observaciones: turno.observaciones || '',
      });
      
      // Cargar conductores y asistentes del turno
      setFormConductores(turno.conductores?.map(c => ({
        conductor_id: c.id,
        rol: c.pivot?.rol || 'principal'
      })) || [{ conductor_id: '', rol: 'principal' }]);
      
      setFormAsistentes(turno.asistentes?.map(a => ({
        asistente_id: a.id,
        posicion: a.pivot?.posicion || 'general'
      })) || []);
      
    } else {
      // Nuevo turno
      setEditingTurno(null);
      
      const fechaInicial = date 
        ? date.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      setFormData({
        bus_id: '',
        fecha_turno: fechaInicial,
        hora_inicio: '06:00',
        hora_termino: '14:00',
        tipo_turno: 'mañana',
        estado: 'programado',
        observaciones: '',
      });
      
      setFormConductores([{ conductor_id: '', rol: 'principal' }]);
      setFormAsistentes([]);
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTurno(null);
  };

  const handleAgregarConductor = () => {
    setFormConductores([...formConductores, { conductor_id: '', rol: 'apoyo' }]);
  };

  const handleEliminarConductor = (index) => {
    if (formConductores.length > 1) {
      setFormConductores(formConductores.filter((_, i) => i !== index));
    }
  };

  const handleConductorChange = (index, field, value) => {
    const updated = [...formConductores];
    updated[index][field] = value;
    setFormConductores(updated);
  };

  const handleAgregarAsistente = () => {
    setFormAsistentes([...formAsistentes, { asistente_id: '', posicion: 'general' }]);
  };

  const handleEliminarAsistente = (index) => {
    setFormAsistentes(formAsistentes.filter((_, i) => i !== index));
  };

  const handleAsistenteChange = (index, field, value) => {
    const updated = [...formAsistentes];
    updated[index][field] = value;
    setFormAsistentes(updated);
  };

  const handleSave = async () => {
    try {
      // Validar que tenga al menos un conductor
      const conductoresValidos = formConductores.filter(c => c.conductor_id);
      if (conductoresValidos.length === 0) {
        setError('Debe asignar al menos un conductor');
        return;
      }

      // Validar que bus doble piso tenga asistente
      const busSeleccionado = buses.find(b => b.id === parseInt(formData.bus_id));
      if (busSeleccionado?.tipo_bus === 'doble_piso') {
        const asistentesValidos = formAsistentes.filter(a => a.asistente_id);
        if (asistentesValidos.length === 0) {
          setError('Los buses de doble piso requieren al menos un asistente');
          return;
        }
      }

      const payload = {
        ...formData,
        conductores: conductoresValidos,
        asistentes: formAsistentes.filter(a => a.asistente_id),
      };

      if (editingTurno) {
        await updateTurno(editingTurno.id, payload);
        setSuccess('Turno actualizado exitosamente');
      } else {
        await createTurno(payload);
        setSuccess('Turno creado exitosamente');
      }

      loadTurnos();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este turno?')) {
      try {
        await deleteTurno(id);
        setSuccess('Turno eliminado exitosamente');
        loadTurnos();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  // Utilidades
  const getEstadoColor = (estado) => {
    const colors = {
      'programado': 'bg-blue-100 text-blue-800',
      'en_curso': 'bg-yellow-100 text-yellow-800',
      'completado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getTipoTurnoColor = (tipo) => {
    const colors = {
      'mañana': 'bg-amber-100 text-amber-800',
      'tarde': 'bg-orange-100 text-orange-800',
      'noche': 'bg-indigo-100 text-indigo-800',
      'completo': 'bg-purple-100 text-purple-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
  };

  const busSeleccionado = buses.find(b => b.id === parseInt(formData.bus_id));
  const requiresAsistente = busSeleccionado?.tipo_bus === 'doble_piso';

  // Renderizado del calendario
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Turnos / Rotativas</h1>
          <p className="text-gray-600 mt-2">Asigna conductores y asistentes a los buses</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleOpenDialog(null, selectedDate)}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Turno
        </Button>
      </div>

      {/* Mensajes */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Controles del calendario */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeMonth(-1)}
              className="flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>
            
            <h2 className="text-xl font-bold capitalize">{monthName}</h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeMonth(1)}
              className="flex items-center gap-2"
            >
              Siguiente
              <ChevronRight size={16} />
            </Button>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={goToToday}
            className="flex items-center gap-2"
          >
            <CalendarIcon size={16} />
            Hoy
          </Button>
        </div>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-2">
          {/* Días de la semana */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}

          {/* Espacios vacíos antes del primer día */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Días del mes */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const turnosDelDia = getTurnosForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square border rounded-lg p-2 cursor-pointer transition-colors ${
                  isToday ? 'border-blue-500 bg-blue-50' :
                  isSelected ? 'border-blue-400 bg-blue-100' :
                  'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-semibold mb-1">{day}</div>
                <div className="space-y-1">
                  {turnosDelDia.slice(0, 3).map((turno, i) => (
                    <div
                      key={i}
                      className={`text-xs px-1 py-0.5 rounded truncate ${getTipoTurnoColor(turno.tipo_turno)}`}
                      title={`${turno.bus?.patente} - ${turno.tipo_turno}`}
                    >
                      {turno.bus?.patente}
                    </div>
                  ))}
                  {turnosDelDia.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{turnosDelDia.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de turnos del día seleccionado */}
      {selectedDate && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">
            Turnos del {formatDate(selectedDate)}
          </h3>
          
          {getTurnosForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay turnos programados para este día
            </p>
          ) : (
            <div className="space-y-4">
              {getTurnosForDate(selectedDate).map((turno) => (
                <div key={turno.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-bold text-lg text-blue-600">
                          {turno.bus?.patente}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTipoTurnoColor(turno.tipo_turno)}`}>
                          {turno.tipo_turno}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(turno.estado)}`}>
                          {turno.estado}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                          {turno.hora_inicio} - {turno.hora_termino}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">Conductores:</span>
                          <ul className="ml-4 mt-1">
                            {turno.conductores?.map((c, i) => (
                              <li key={i}>
                                • {c.empleado?.user?.nombre} {c.empleado?.user?.apellido}
                                <span className="text-gray-500 ml-2">({c.pivot?.rol})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {turno.asistentes?.length > 0 && (
                          <div>
                            <span className="font-semibold">Asistentes:</span>
                            <ul className="ml-4 mt-1">
                              {turno.asistentes.map((a, i) => (
                                <li key={i}>
                                  • {a.empleado?.user?.nombre} {a.empleado?.user?.apellido}
                                  <span className="text-gray-500 ml-2">({a.pivot?.posicion})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      {turno.observaciones && (
                        <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {turno.observaciones}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenDialog(turno)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(turno.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Crear/Editar Turno */}
      <FormDialog
        isOpen={openDialog}
        title={editingTurno ? 'Editar Turno' : 'Nuevo Turno'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
        size="large"
      >
        <div className="space-y-6">
          {/* SECCIÓN 1: Fecha y Horario */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
               Fecha y Horario
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha del Turno *"
                type="date"
                value={formData.fecha_turno}
                onChange={(e) => setFormData({ ...formData, fecha_turno: e.target.value })}
                required
              />
              
              <Select
                label="Tipo de Turno *"
                options={TIPOS_TURNO.map(t => ({ 
                  id: t, 
                  label: t.charAt(0).toUpperCase() + t.slice(1) 
                }))}
                value={formData.tipo_turno}
                onChange={(e) => setFormData({ ...formData, tipo_turno: e.target.value })}
                required
              />
              
              <Input
                label="Hora Inicio *"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                required
              />
              
              <Input
                label="Hora Término *"
                type="time"
                value={formData.hora_termino}
                onChange={(e) => setFormData({ ...formData, hora_termino: e.target.value })}
                required
              />
            </div>
          </div>

          {/* SECCIÓN 2: Bus */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
               Bus Asignado
            </h3>
            <Select
              label="Seleccionar Bus *"
              options={[
                { id: '', label: 'Seleccione un bus' },
                ...buses
                  .filter(b => b.estado === 'operativo')
                  .map(b => ({ 
                    id: b.id, 
                    label: `${b.patente} - ${b.marca} ${b.modelo} (${b.tipo_bus === 'doble_piso' ? 'Doble Piso' : 'Simple'})` 
                  }))
              ]}
              value={formData.bus_id}
              onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
              required
            />
            {busSeleccionado && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                <p><strong>Tipo:</strong> {busSeleccionado.tipo_bus === 'doble_piso' ? ' Doble Piso' : ' Simple'}</p>
                <p><strong>Capacidad:</strong> {busSeleccionado.capacidad_pasajeros} pasajeros</p>
                {requiresAsistente && (
                  <p className="text-blue-700 mt-2">
                     Este bus requiere al menos un asistente
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN 3: Conductores */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
               Conductores
            </h3>
            <div className="space-y-3">
              {formConductores.map((conductor, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Select
                      label={`Conductor ${index + 1} *`}
                      options={[
                        { id: '', label: 'Seleccione un conductor' },
                        ...conductores
                          .filter(c => c.estado === 'activo' && c.apto_conducir)
                          .map(c => ({
                            id: c.id,
                            label: `${c.empleado?.user?.nombre} ${c.empleado?.user?.apellido} (${c.empleado?.numero_funcional})`
                          }))
                      ]}
                      value={conductor.conductor_id}
                      onChange={(e) => handleConductorChange(index, 'conductor_id', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="w-40">
                    <Select
                      label="Rol *"
                      options={ROLES_CONDUCTOR.map(r => ({ 
                        id: r, 
                        label: r.charAt(0).toUpperCase() + r.slice(1) 
                      }))}
                      value={conductor.rol}
                      onChange={(e) => handleConductorChange(index, 'rol', e.target.value)}
                      required
                    />
                  </div>
                  
                  {formConductores.length > 1 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleEliminarConductor(index)}
                      className="mb-1"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAgregarConductor}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Agregar Conductor
              </Button>
            </div>
          </div>

          {/* SECCIÓN 4: Asistentes (opcional, pero requerido para doble piso) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
               Asistentes {requiresAsistente && <span className="text-red-600">*</span>}
            </h3>
            
            {formAsistentes.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-3">No hay asistentes asignados</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarAsistente}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus size={16} />
                  Agregar Asistente
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {formAsistentes.map((asistente, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Select
                        label={`Asistente ${index + 1} ${requiresAsistente ? '*' : ''}`}
                        options={[
                          { id: '', label: 'Seleccione un asistente' },
                          ...asistentes
                            .filter(a => a.estado === 'activo')
                            .map(a => ({
                              id: a.id,
                              label: `${a.empleado?.user?.nombre} ${a.empleado?.user?.apellido} (${a.empleado?.numero_funcional})`
                            }))
                        ]}
                        value={asistente.asistente_id}
                        onChange={(e) => handleAsistenteChange(index, 'asistente_id', e.target.value)}
                        required={requiresAsistente}
                      />
                    </div>
                    
                    <div className="w-48">
                      <Select
                        label="Posición"
                        options={POSICIONES_ASISTENTE.map(p => ({
                          id: p,
                          label: p === 'piso_superior' ? 'Piso Superior' :
                                 p === 'piso_inferior' ? 'Piso Inferior' :
                                 'General'
                        }))}
                        value={asistente.posicion}
                        onChange={(e) => handleAsistenteChange(index, 'posicion', e.target.value)}
                      />
                    </div>
                    
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleEliminarAsistente(index)}
                      className="mb-1"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarAsistente}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Agregar Asistente
                </Button>
              </div>
            )}
          </div>

          {/* SECCIÓN 5: Estado y Observaciones */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
               Información Adicional
            </h3>
            
            <Select
              label="Estado"
              options={ESTADOS_TURNO.map(e => ({ 
                id: e, 
                label: e.charAt(0).toUpperCase() + e.slice(1).replace('_', ' ')
              }))}
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            />
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Notas adicionales sobre el turno..."
              />
            </div>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}