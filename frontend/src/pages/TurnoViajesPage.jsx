import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Clock, MapPin, CheckCircle, XCircle, Calendar, 
  Bus, Users, Map, Trash2, Pencil 
} from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import ViajeDetallePage from './ViajeDetallePage';
import { 
  fetchViajesPorTurno,
  fetchRutas,
  createViaje,
  updateViaje,
  finalizarViaje,
  cancelarViaje,
  deleteViaje
} from '../services/api';
import { getNowDatetimeLocal, toBackendDatetime, formatTime } from '../utils/dateHelpers';

export default function TurnoViajesPage({ turno, onVolver }) {
  const [viajes, setViajes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [openFinalizarDialog, setOpenFinalizarDialog] = useState(false);

  const [viajeAFinalizar, setViajeAFinalizar] = useState(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);

  // estados para edición
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    ruta_id: '',
    origen: '',
    destino: '',
    fecha_hora_salida: '',
    fecha_hora_llegada: '',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const viajesData = await fetchViajesPorTurno(turno.id);
      setViajes(viajesData);
      
      const rutasData = await fetchRutas();
      const rutasActivas = rutasData.filter(r => r.estado === 'activa');
      setRutas(rutasActivas);
      
      setError(null);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setIsEditing(false);
    setEditId(null);

    setFormData({
      ruta_id: '',
      origen: '',
      destino: '',
      fecha_hora_salida: getNowDatetimeLocal(),
      fecha_hora_llegada: '',
      observaciones: '',
    });
    setOpenDialog(true);
  };

  const handleEdit = (viaje) => {
    setIsEditing(true);
    setEditId(viaje.id);

    let fechaFormateada = '';
    if (viaje.fecha_hora_salida) {
      const date = new Date(viaje.fecha_hora_salida);
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      fechaFormateada = date.toISOString().slice(0, 16);
    }

    const rutaDelViaje = rutas.find(r => r.id === viaje.ruta_id) || viaje.ruta || {};

    setFormData({
      ruta_id: viaje.ruta_id,
      origen: rutaDelViaje.origen || '',
      destino: rutaDelViaje.destino || '',
      fecha_hora_salida: fechaFormateada || getNowDatetimeLocal(),
      fecha_hora_llegada: '',
      observaciones: viaje.observaciones || '',
    });

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setEditId(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.fecha_hora_salida) {
        alert('Por favor establece la hora de salida');
        return;
      }

      if (isEditing) {
        // actualizar solo fecha/hora y observaciones
        await updateViaje(editId, {
          fecha_hora_salida: toBackendDatetime(formData.fecha_hora_salida),
          observaciones: formData.observaciones || '',
        });
        alert('Viaje actualizado exitosamente');
      } else {
        // validación solo para creación
        if (!formData.ruta_id) {
          alert('Por favor selecciona una ruta');
          return;
        }

        const viajeData = {
          asignacion_turno_id: turno.id,
          ruta_id: parseInt(formData.ruta_id, 10),
          fecha_hora_salida: toBackendDatetime(formData.fecha_hora_salida),
          fecha_hora_llegada: null,
          estado: 'programado',
          observaciones: formData.observaciones || '',
        };

        console.log('Enviando al backend:', viajeData);
        await createViaje(viajeData);
        alert('Viaje programado exitosamente');
      }

      loadData();
      handleCloseDialog();
    } catch (err) {
      console.error('Error al guardar:', err);
      setError('Error al guardar: ' + err.message);
      alert('Error al guardar el viaje: ' + err.message);
    }
  };

  const handleIniciarViaje = async (viajeId) => {
    try {
      await updateViaje(viajeId, {
        estado: 'en_curso',
        fecha_hora_salida: toBackendDatetime(getNowDatetimeLocal()),
      });
      loadData();
      alert('Viaje iniciado');
    } catch (err) {
      setError('Error al iniciar viaje: ' + err.message);
      alert('Error al iniciar viaje: ' + err.message);
    }
  };

  const handleOpenFinalizar = (viaje) => {
    setViajeAFinalizar(viaje);
    setFormData((prev) => ({
      ...prev,
      fecha_hora_llegada: getNowDatetimeLocal(),
      observaciones: viaje.observaciones || '',
    }));
    setOpenFinalizarDialog(true);
  };

  const handleFinalizar = async () => {
    try {
      if (!formData.fecha_hora_llegada) {
        alert('Por favor establece la hora de llegada');
        return;
      }

      await finalizarViaje(viajeAFinalizar.id, {
        fecha_hora_llegada: toBackendDatetime(formData.fecha_hora_llegada),
        observaciones: formData.observaciones || '',
      });
      loadData();
      setOpenFinalizarDialog(false);
      setViajeAFinalizar(null);
      alert('Viaje finalizado exitosamente');
    } catch (err) {
      console.error('Error al finalizar:', err);
      setError('Error al finalizar: ' + err.message);
      alert('Error al finalizar: ' + err.message);
    }
  };

  const handleCancelar = async (viajeId) => {
    const motivo = prompt('Ingresa el motivo de la cancelación:');
    if (!motivo) return;
    
    try {
      await cancelarViaje(viajeId, motivo);
      loadData();
      alert('Viaje cancelado');
    } catch (err) {
      setError('Error al cancelar: ' + err.message);
      alert('Error al cancelar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este viaje?')) {
      try {
        await deleteViaje(id);
        loadData();
        alert('Viaje eliminado');
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
        alert('Error al eliminar: ' + err.message);
      }
    }
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
    { 
      id: 'codigo_viaje', 
      label: 'Código',
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-blue-600">
          {row.codigo_viaje}
        </span>
      )
    },
    { 
      id: 'patente', 
      label: 'Bus',
      render: () => (
        <span className="font-mono font-bold text-gray-900">
          {turno.bus?.patente || 'N/A'}
        </span>
      )
    },
    { 
      id: 'nombre_viaje', 
      label: 'Ruta',
      render: (row) => (
        <button
          onClick={() => setViajeSeleccionado(row.id)}
          className="flex items-center gap-2 hover:text-blue-600 transition-colors text-left"
        >
          <MapPin size={16} className="text-green-400" />
          <span className="font-medium underline">{row.nombre_viaje}</span>
        </button>
      )
    },
    { 
      id: 'fecha_hora_salida', 
      label: 'Salida', 
      render: (row) => formatTime(row.fecha_hora_salida)
    },
    { 
      id: 'fecha_hora_llegada', 
      label: 'Llegada', 
      render: (row) => row.fecha_hora_llegada ? formatTime(row.fecha_hora_llegada) : '-'
    },
    {
      id: 'duracion',
      label: 'Duración',
      render: (row) => {
        if (!row.fecha_hora_llegada) return '-';
        const salida = new Date(row.fecha_hora_salida);
        const llegada = new Date(row.fecha_hora_llegada);
        const diff = Math.floor((llegada - salida) / 1000 / 60);
        const horas = Math.floor(diff / 60);
        const minutos = diff % 60;
        return `${horas}h ${minutos}min`;
      }
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
    {
      id: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          {/* Editar solo cuando está programado */}
          {row.estado === 'programado' && (
            <button
              onClick={() => handleEdit(row)}
              className="flex items-center justify-center w-8 h-8 text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300 transition-colors"
              title="Editar Viaje"
            >
              <Pencil size={16} />
            </button>
          )}

          {row.estado === 'programado' && (
            <button
              onClick={() => handleIniciarViaje(row.id)}
              className="flex items-center justify-center w-8 h-8 text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors"
              title="Iniciar Viaje"
            >
              <Clock size={16} />
            </button>
          )}
          
          {row.estado === 'en_curso' && (
            <button
              onClick={() => handleOpenFinalizar(row)}
              className="flex items-center justify-center w-8 h-8 text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 transition-colors"
              title="Finalizar Viaje"
            >
              <CheckCircle size={16} />
            </button>
          )}
          
          {row.estado !== 'completado' && row.estado !== 'cancelado' && (
            <button
              onClick={() => handleCancelar(row.id)}
              className="flex items-center justify-center w-8 h-8 text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 hover:border-orange-300 transition-colors"
              title="Cancelar Viaje"
            >
              <XCircle size={16} />
            </button>
          )}

          <button
            onClick={() => handleDelete(row.id)}
            className="flex items-center justify-center w-8 h-8 text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (viajeSeleccionado) {
    return (
      <ViajeDetallePage
        viajeId={viajeSeleccionado}
        onVolver={() => {
          setViajeSeleccionado(null);
          loadData();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando viajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      <div className="mb-6">
        <button
          onClick={onVolver}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Volver a Turnos
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Viajes</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Administra los viajes asociados al turno actual.</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleOpenDialog}
            className="flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            {isEditing ? 'Editar Viaje' : 'Agregar Viaje'}
          </Button>
        </div>
        <Map className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Info del Turno */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Turno</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Fecha</p>
              <p className="font-semibold text-gray-900">
                {new Date(turno.fecha_turno).toLocaleDateString('es-CL')}
              </p>
              <p className="text-xs text-gray-500 capitalize">{turno.tipo_turno}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Horario</p>
              <p className="font-semibold text-gray-900">
                {turno.hora_inicio} - {turno.hora_termino}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bus size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Bus</p>
              <p className="font-bold text-gray-900 text-lg">
                {turno.bus?.patente || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {turno.bus?.marca} {turno.bus?.modelo}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Tripulación</p>
              
              <div className="mt-1 space-y-1">
                {/* Listado de Conductores */}
                {turno.conductores?.map((c, i) => (
                    <div key={`c-${i}`} className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Conductor"></div>
                        <span>{c.empleado?.user?.nombre} {c.empleado?.user?.apellido?.charAt(0)}.</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">COND</span>
                    </div>
                ))}

                {/* Listado de Asistentes */}
                {turno.asistentes?.map((a, i) => (
                    <div key={`a-${i}`} className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Asistente"></div>
                        <span>{a.empleado?.user?.nombre} {a.empleado?.user?.apellido?.charAt(0)}.</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">ASIST</span>
                    </div>
                ))}

                {(!turno.conductores?.length && !turno.asistentes?.length) && (
                    <span className="text-sm text-gray-400 italic">Sin asignar</span>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Tabla de viajes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Viajes Registrados ({viajes.length})
          </h2>
        </div>
        <Table
          columns={columns}
          data={viajes}
          loading={false}
        />
      </div>

      {/* Dialog Crear / Editar */}
      <FormDialog
        isOpen={openDialog}
        title={isEditing ? 'Editar Viaje' : 'Agregar Viaje al Turno'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <div className="space-y-4">
          {!isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Bus:</strong> {turno.bus?.patente || 'N/A'}<br />
                <strong>Tripulación:</strong> Heredada del turno automáticamente
              </p>
            </div>
          )}

          <Select
            label="Ruta *"
            options={rutas.map(ruta => ({
              id: ruta.id,
              label: `${ruta.codigo_ruta} - ${ruta.nombre_ruta}`
            }))}
            value={formData.ruta_id}
            onChange={(e) => {
              const rutaSeleccionada = rutas.find(r => r.id === parseInt(e.target.value, 10));
              setFormData({ 
                ...formData, 
                ruta_id: e.target.value,
                origen: rutaSeleccionada?.origen || '',
                destino: rutaSeleccionada?.destino || ''
              });
            }}
            required={!isEditing}
            disabled={isEditing}
          />

          {isEditing && (
            <p className="text-xs text-gray-500 -mt-3 mb-3">
              La ruta no puede ser modificada una vez creado el viaje.
            </p>
          )}

          {formData.ruta_id && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Origen:</strong> {formData.origen}<br />
                <strong>Destino:</strong> {formData.destino}
              </p>
            </div>
          )}

          <Input
            label="Hora de Salida Programada *"
            type="datetime-local"
            value={formData.fecha_hora_salida}
            onChange={(e) => setFormData({ ...formData, fecha_hora_salida: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Observaciones del viaje..."
            />
          </div>

          {!isEditing && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Importante: El viaje se creará como "PROGRAMADO". Luego presiona "Iniciar" cuando comience el viaje.
              </p>
            </div>
          )}
        </div>
      </FormDialog>

      {/* Dialog Finalizar */}
      <FormDialog
        isOpen={openFinalizarDialog}
        title="Finalizar Viaje"
        onSubmit={handleFinalizar}
        onCancel={() => setOpenFinalizarDialog(false)}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Viaje:</strong> {viajeAFinalizar?.codigo_viaje}<br />
              <strong>Ruta:</strong> {viajeAFinalizar?.nombre_viaje}
            </p>
          </div>

          <Input
            label="Hora de Llegada *"
            type="datetime-local"
            value={formData.fecha_hora_llegada}
            onChange={(e) => setFormData({ ...formData, fecha_hora_llegada: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones Finales
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Observaciones finales del viaje..."
            />
          </div>
        </div>
      </FormDialog>
    </div>
  );
}