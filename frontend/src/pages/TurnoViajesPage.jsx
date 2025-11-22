import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Clock, MapPin, CheckCircle, XCircle, Calendar, Bus, Users } from 'lucide-react';
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

export default function TurnoViajesPage({ turno, onVolver }) {
  const [viajes, setViajes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openFinalizarDialog, setOpenFinalizarDialog] = useState(false);
  const [viajeAFinalizar, setViajeAFinalizar] = useState(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    ruta_id: '',
    origen: '',
    destino: '',
    fecha_hora_salida: '',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar viajes del turno
      const viajesData = await fetchViajesPorTurno(turno.id);
      setViajes(viajesData);
      
      // Cargar rutas activas
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
    // Inicializar con hora actual
    const ahora = new Date();
    const fechaHoraActual = ahora.toISOString().slice(0, 16);
    
    setFormData({
      ruta_id: '',
      origen: '',
      destino: '',
      fecha_hora_salida: fechaHoraActual,
      observaciones: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      const viajeData = {
        asignacion_turno_id: turno.id,
        ruta_id: formData.ruta_id,
        fecha_hora_salida: formData.fecha_hora_salida,
        fecha_hora_llegada: null,
        estado: 'programado',
        observaciones: formData.observaciones,
      };
      
      await createViaje(viajeData);
      loadData();
      handleCloseDialog();
      alert('Viaje programado exitosamente');
    } catch (err) {
      console.error('Error al guardar:', err);
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleIniciarViaje = async (viajeId) => {
    try {
      const ahora = new Date().toISOString();
      await updateViaje(viajeId, {
        estado: 'en_curso',
        fecha_hora_salida: ahora
      });
      loadData();
      alert('Viaje iniciado');
    } catch (err) {
      setError('Error al iniciar viaje: ' + err.message);
    }
  };

  const handleOpenFinalizar = (viaje) => {
    setViajeAFinalizar(viaje);
    
    const ahora = new Date();
    const fechaHoraActual = ahora.toISOString().slice(0, 16);
    
    setFormData({
      fecha_hora_llegada: fechaHoraActual,
      observaciones: viaje.observaciones || '',
    });
    setOpenFinalizarDialog(true);
  };

  const handleFinalizar = async () => {
    try {
      await finalizarViaje(viajeAFinalizar.id, {
        fecha_hora_llegada: formData.fecha_hora_llegada,
        observaciones: formData.observaciones,
      });
      loadData();
      setOpenFinalizarDialog(false);
      setViajeAFinalizar(null);
      alert('Viaje finalizado exitosamente');
    } catch (err) {
      console.error('Error al finalizar:', err);
      setError('Error al finalizar: ' + err.message);
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
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este viaje?')) {
      try {
        await deleteViaje(id);
        loadData();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
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
      render: (row) => (
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
      render: (row) => {
        const fecha = new Date(row.fecha_hora_salida);
        return fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      }
    },
    { 
      id: 'fecha_hora_llegada', 
      label: 'Llegada', 
      render: (row) => {
        if (!row.fecha_hora_llegada) return '-';
        const fecha = new Date(row.fecha_hora_llegada);
        return fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      }
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
          {row.estado === 'programado' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleIniciarViaje(row.id)}
              className="flex items-center gap-1"
            >
              <Clock size={14} />
              Iniciar
            </Button>
          )}
          
          {row.estado === 'en_curso' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenFinalizar(row)}
              className="flex items-center gap-1"
            >
              <CheckCircle size={14} />
              Finalizar
            </Button>
          )}
          
          {row.estado !== 'completado' && row.estado !== 'cancelado' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCancelar(row.id)}
              className="flex items-center gap-1"
            >
              <XCircle size={14} />
              Cancelar
            </Button>
          )}
        </div>
      ),
    },
  ];
  // Si se ha seleccionado un viaje, mostrar detalle
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
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="secondary"
          onClick={onVolver}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Volver a Turnos
        </Button>

        <h1 className="text-3xl font-bold text-gray-900"> Gestión de Viajes del Turno</h1>
        <p className="text-gray-600 mt-2">Agrega y administra los viajes de este turno</p>
      </div>

      {/* Error */}
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
              {turno.conductores && turno.conductores.length > 0 ? (
                <div className="text-sm">
                  {turno.conductores.map((c, i) => (
                    <p key={i} className="font-medium text-gray-900">
                      {c.empleado?.user?.nombre} {c.empleado?.user?.apellido?.charAt(0)}.
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin conductores</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="primary"
            size="lg"
            onClick={handleOpenDialog}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Agregar Viaje
          </Button>
        </div>
      </div>

      {/* Tabla de Viajes */}
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
          onDelete={handleDelete}
        />
      </div>

      {/* Dialog: Agregar Viaje */}
      <FormDialog
        isOpen={openDialog}
        title="Agregar Viaje al Turno"
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Bus:</strong> {turno.bus?.patente || 'N/A'}<br />
              <strong>Tripulación:</strong> Heredada del turno automáticamente
            </p>
          </div>

          <Select
            label="Ruta *"
            options={rutas.map(ruta => ({
              id: ruta.id,
              label: `${ruta.codigo_ruta} - ${ruta.nombre_ruta}`
            }))}
            value={formData.ruta_id}
            onChange={(e) => {
              const rutaSeleccionada = rutas.find(r => r.id === parseInt(e.target.value));
              setFormData({ 
                ...formData, 
                ruta_id: e.target.value,
                origen: rutaSeleccionada?.origen || '',
                destino: rutaSeleccionada?.destino || ''
              });
            }}
            required
          />

          {formData.ruta_id && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong> Origen:</strong> {formData.origen}<br />
                <strong> Destino:</strong> {formData.destino}
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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
                 <strong>Importante:</strong> El viaje se creará como "PROGRAMADO". Luego presiona "Iniciar" cuando comience el viaje.
            </p>
          </div>
        </div>
      </FormDialog>

      {/* Dialog: Finalizar Viaje */}
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
