import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, MapPin, CheckCircle, Save, Edit2, X } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { 
  fetchViajeById,
  updateViaje,
  finalizarViaje
} from '../services/api';

export default function ViajeDetallePage({ viajeId, onVolver }) {
  const [viaje, setViaje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(false);
  const [paradas, setParadas] = useState([]);

  useEffect(() => {
    loadViaje();
  }, [viajeId]);

  const loadViaje = async () => {
    try {
      setLoading(true);
      const data = await fetchViajeById(viajeId);
      console.log('Viaje cargado:', data); // Debug
      setViaje(data);
      
      // Cargar paradas de la ruta
      if (data.ruta?.paradas) {
        // Inicializar paradas con horas vacías
        const paradasConHoras = data.ruta.paradas.map((parada, index) => {
          if (index === 0) {
            // Primera parada (origen): usar hora de salida del viaje
            const horaSalida = new Date(data.fecha_hora_salida).toTimeString().slice(0, 5);
            return {
              ...parada,
              hora_llegada: horaSalida,
              hora_salida: horaSalida,
            };
          }
          return {
            ...parada,
            hora_llegada: '',
            hora_salida: '',
          };
        });
        setParadas(paradasConHoras);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error al cargar viaje:', err);
      setError('Error al cargar viaje: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const actualizarHoraParada = (index, campo, valor) => {
    const nuevasParadas = [...paradas];
    nuevasParadas[index][campo] = valor;
    setParadas(nuevasParadas);
  };

  const handleGuardarHoras = async () => {
    try {
      // Por ahora solo guardamos las horas en observaciones
      // TODO: En el futuro crear tabla viajes_paradas
      const horasRegistradas = paradas
        .filter((p, i) => i > 0) // Excluir origen
        .map(p => ({
          ciudad: p.ciudad,
          hora_llegada: p.hora_llegada,
          hora_salida: p.hora_salida
        }));
      
      await updateViaje(viajeId, {
        observaciones: `${viaje.observaciones || ''}\n\nHoras registradas:\n${JSON.stringify(horasRegistradas, null, 2)}`
      });
      
      setEditando(false);
      alert('Horas guardadas exitosamente');
      loadViaje();
    } catch (err) {
      setError('Error al guardar horas: ' + err.message);
    }
  };

  const handleFinalizarViaje = async () => {
    try {
      const ultimaParada = paradas[paradas.length - 1];
      
      if (!ultimaParada.hora_llegada) {
        alert('Debes registrar la hora de llegada al destino final');
        return;
      }
      
      // Convertir hora a datetime
      const fecha = new Date(viaje.fecha_hora_salida).toISOString().split('T')[0];
      const horaLlegada = `${fecha}T${ultimaParada.hora_llegada}:00`;
      
      await finalizarViaje(viajeId, {
        fecha_hora_llegada: horaLlegada,
        observaciones: viaje.observaciones
      });
      
      alert('Viaje finalizado exitosamente');
      onVolver();
    } catch (err) {
      setError('Error al finalizar: ' + err.message);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando viaje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Button
          variant="secondary"
          onClick={onVolver}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Volver
        </Button>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!viaje) {
    return (
      <div className="p-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No se encontró el viaje
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
          Volver a Viajes
        </Button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {viaje.codigo_viaje}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoColor(viaje.estado)}`}>
                  {viaje.estado}
                </span>
              </div>
              <p className="text-xl text-gray-700 font-medium">
                {viaje.nombre_viaje}
              </p>
              <p className="text-gray-600 mt-1">
                {viaje.ruta?.origen} → {viaje.ruta?.destino}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Bus</div>
              <div className="text-2xl font-bold text-blue-600">
                {viaje.asignacion_turno?.bus?.patente || 
                 viaje.asignacionTurno?.bus?.patente || 
                 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {viaje.asignacion_turno?.bus?.marca || viaje.asignacionTurno?.bus?.marca || ''} {' '}
                {viaje.asignacion_turno?.bus?.modelo || viaje.asignacionTurno?.bus?.modelo || ''}
              </div>
            </div>
          </div>

          {/* Tripulación */}
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Conductores:</p>
              {(viaje.asignacion_turno?.conductores || viaje.asignacionTurno?.conductores || []).length > 0 ? (
                (viaje.asignacion_turno?.conductores || viaje.asignacionTurno?.conductores).map((c, i) => (
                  <p key={i} className="text-sm text-gray-600">
                    • {c.empleado?.user?.nombre || 'N/A'} {c.empleado?.user?.apellido || ''} 
                    {c.pivot?.rol && ` (${c.pivot.rol})`}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-500">Sin conductores asignados</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Asistentes:</p>
              {(viaje.asignacion_turno?.asistentes || viaje.asignacionTurno?.asistentes || []).length > 0 ? (
                (viaje.asignacion_turno?.asistentes || viaje.asignacionTurno?.asistentes).map((a, i) => (
                  <p key={i} className="text-sm text-gray-600">
                    • {a.empleado?.user?.nombre || 'N/A'} {a.empleado?.user?.apellido || ''} 
                    {a.pivot?.posicion && ` (${a.pivot.posicion})`}
                  </p>
                ))
              ) : (
                <p className="text-sm text-gray-500">Sin asistentes</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Paradas y Tarifas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="text-blue-600" size={24} />
            Paradas, Tarifas y Horarios ({paradas.length})
          </h2>
          {(viaje.estado === 'en_curso' || viaje.estado === 'programado') && !editando && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditando(true)}
              className="flex items-center gap-2"
            >
              <Edit2 size={16} />
              Registrar Horarios
            </Button>
          )}
          {editando && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditando(false);
                  loadViaje();
                }}
                className="flex items-center gap-2"
              >
                <X size={16} />
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGuardarHoras}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Guardar Horas
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {paradas.map((parada, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                parada.es_origen || parada.es_destino
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900 mb-2">
                    {parada.ciudad}
                    {parada.es_origen && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                        ORIGEN
                      </span>
                    )}
                    {parada.es_destino && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-semibold">
                        DESTINO
                      </span>
                    )}
                  </div>

                  {/* Distancia y Tiempo */}
                  {index > 0 && (
                    <div className="flex gap-4 text-sm text-gray-600 mb-3">
                      <span>📏 {parada.distancia_desde_anterior_km || 0} km desde anterior</span>
                      <span>⏱️ {parada.tiempo_desde_anterior_min || 0} min estimado</span>
                    </div>
                  )}

                  {/* Tarifas (solo si no es origen) */}
                  {!parada.es_origen && (
                    <div className="bg-white rounded border border-gray-200 p-3 mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">💰 Tarifas desde origen:</p>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Adulto:</span>
                          <span className="ml-2 font-bold text-green-600">
                            ${(parada.tarifa_adulto || 0).toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Estudiante:</span>
                          <span className="ml-2 font-bold text-green-600">
                            ${(parada.tarifa_estudiante || 0).toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">3ra Edad:</span>
                          <span className="ml-2 font-bold text-green-600">
                            ${(parada.tarifa_tercera_edad || 0).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Registro de Horas */}
                  {index > 0 && (
                    <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded border border-gray-200">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Hora de Llegada
                        </label>
                        {editando ? (
                          <Input
                            type="time"
                            value={parada.hora_llegada || ''}
                            onChange={(e) => actualizarHoraParada(index, 'hora_llegada', e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded">
                            {parada.hora_llegada || '-'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Hora de Salida
                        </label>
                        {editando ? (
                          <Input
                            type="time"
                            value={parada.hora_salida || ''}
                            onChange={(e) => actualizarHoraParada(index, 'hora_salida', e.target.value)}
                            className="w-full"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded">
                            {parada.hora_salida || '-'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botón Finalizar Viaje */}
        {viaje.estado === 'en_curso' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="primary"
              size="lg"
              onClick={handleFinalizarViaje}
              className="w-full flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              Finalizar Viaje Completo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}