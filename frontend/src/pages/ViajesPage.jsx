import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Bus, ChevronRight } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import TurnoViajesPage from './TurnoViajesPage';
import { 
  fetchTurnos,
  fetchViajesPorTurno
} from '../services/api';

export default function ViajesPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTurnos();
  }, [fechaSeleccionada]);

  const loadTurnos = async () => {
    try {
      setLoading(true);
      
      // Buscar todos los turnos de la fecha seleccionada
      const turnosData = await fetchTurnos({ fecha: fechaSeleccionada });
      
      // Cargar cantidad de viajes por cada turno
      const turnosConViajes = await Promise.all(
        turnosData.map(async (turno) => {
          try {
            const viajes = await fetchViajesPorTurno(turno.id);
            return {
              ...turno,
              cantidad_viajes: viajes.length,
              viajes_completados: viajes.filter(v => v.estado === 'completado').length,
              viajes_en_curso: viajes.filter(v => v.estado === 'en_curso').length
            };
          } catch (err) {
            return {
              ...turno,
              cantidad_viajes: 0,
              viajes_completados: 0,
              viajes_en_curso: 0
            };
          }
        })
      );
      
      // Ordenar por hora de inicio
      turnosConViajes.sort((a, b) => {
        return a.hora_inicio.localeCompare(b.hora_inicio);
      });
      
      setTurnos(turnosConViajes);
      setError(null);
    } catch (err) {
      console.error('Error al cargar turnos:', err);
      setError('Error al cargar turnos: ' + err.message);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGestionarViajes = (turno) => {
    setTurnoSeleccionado(turno);
  };

  const handleVolverATurnos = () => {
    setTurnoSeleccionado(null);
    loadTurnos(); // Recargar para actualizar contadores
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

  const getTipoTurnoColor = (tipo) => {
    const colors = {
      'mañana': 'bg-amber-100 text-amber-800',
      'tarde': 'bg-orange-100 text-orange-800',
      'noche': 'bg-indigo-100 text-indigo-800',
      'completo': 'bg-purple-100 text-purple-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getTipoTurnoEmoji = (tipo) => {
    const emojis = {
      'mañana': '',
      'tarde': '',
      'noche': '',
      'completo': '',
    };
    return emojis[tipo] || '🚌';
  };

  // Si hay turno seleccionado, mostrar página de gestión
  if (turnoSeleccionado) {
    return (
      <TurnoViajesPage
        turno={turnoSeleccionado}
        onVolver={handleVolverATurnos}
      />
    );
  }

  // Vista principal: Lista de turnos
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando turnos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900"> Gestión de Viajes</h1>
        <p className="text-gray-600 mt-2">Administra los viajes de todos los turnos</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Selector de Fecha */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <Calendar size={24} className="text-blue-600" />
          <label className="text-sm font-medium text-gray-700">Seleccionar fecha:</label>
          <Input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="w-auto"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFechaSeleccionada(new Date().toISOString().split('T')[0])}
          >
            Hoy
          </Button>
          <div className="ml-auto text-sm text-gray-600">
            <strong>{turnos.length}</strong> turno{turnos.length !== 1 ? 's' : ''} programados
          </div>
        </div>
      </div>

      {/* Lista de Turnos */}
      {turnos.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-yellow-800 font-medium text-lg">
            No hay turnos programados para el {new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-CL')}
          </p>
          <p className="text-yellow-600 text-sm mt-2">
            Ve a la página de Turnos para crear nuevos turnos
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {turnos.map((turno) => (
            <div
              key={turno.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Columna Izquierda: Info del Turno */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{getTipoTurnoEmoji(turno.tipo_turno)}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-900 capitalize">
                          Turno {turno.tipo_turno}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTipoTurnoColor(turno.tipo_turno)}`}>
                          {turno.tipo_turno}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(turno.estado)}`}>
                          {turno.estado}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} />
                        <span className="font-semibold">{turno.hora_inicio} - {turno.hora_termino}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Bus */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Bus size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Bus Asignado</p>
                        <p className="font-bold text-gray-900 text-lg">
                          {turno.bus?.patente || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {turno.bus?.marca} {turno.bus?.modelo}
                        </p>
                      </div>
                    </div>

                    {/* Conductores */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Conductores</p>
                        {turno.conductores && turno.conductores.length > 0 ? (
                          <div className="space-y-1">
                            {turno.conductores.map((c, i) => (
                              <p key={i} className="text-sm font-medium text-gray-900">
                                {c.empleado?.user?.nombre} {c.empleado?.user?.apellido}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({c.pivot?.rol})
                                </span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Sin conductores</p>
                        )}
                      </div>
                    </div>

                    {/* Viajes */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MapPin size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Viajes</p>
                        <p className="font-bold text-gray-900 text-2xl">
                          {turno.cantidad_viajes}
                        </p>
                        <div className="flex gap-2 text-xs mt-1">
                          <span className="text-green-600">
                            ✓ {turno.viajes_completados} completados
                          </span>
                          {turno.viajes_en_curso > 0 && (
                            <span className="text-yellow-600">
                                  {turno.viajes_en_curso} en curso
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {turno.observaciones && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                      <strong>Observaciones:</strong> {turno.observaciones}
                    </div>
                  )}
                </div>

                {/* Columna Derecha: Botón de Acción */}
                <div className="ml-6">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleGestionarViajes(turno)}
                    className="flex items-center gap-2"
                  >
                    Gestionar Viajes
                    <ChevronRight size={20} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}