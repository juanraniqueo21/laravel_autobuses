import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Clock, MapPin, CheckCircle, Save, Edit2, X, 
  Bus, Users, Calendar, Hash, Map 
} from 'lucide-react';
import Button from '../components/common/Button';
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
      console.log('Viaje cargado:', data);
      setViaje(data);
      
      // Cargar paradas de la ruta
      if (data.ruta?.paradas) {
        const paradasProcesadas = data.ruta.paradas.map((parada, index) => {
          // Si es la primera parada (origen), prellenar con la hora de salida del viaje (HH:MM)
          if (index === 0) {
            const horaSalida = new Date(data.fecha_hora_salida).toTimeString().slice(0, 5);
            return {
              ...parada,
              hora_llegada: '', // En origen no hay llegada
              hora_salida: horaSalida,
            };
          }
          // Retornar parada con campos listos
          return {
            ...parada,
            hora_llegada: parada.hora_llegada ? parada.hora_llegada.slice(0, 5) : '',
            hora_salida: parada.hora_salida ? parada.hora_salida.slice(0, 5) : '',
            tarifa_adulto: parada.tarifa_adulto || 0,
            tarifa_estudiante: parada.tarifa_estudiante || 0,
            tarifa_tercera_edad: parada.tarifa_tercera_edad || 0,
          };
        });
        setParadas(paradasProcesadas);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error al cargar viaje:', err);
      setError('Error al cargar viaje: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const actualizarParada = (index, campo, valor) => {
    const nuevasParadas = [...paradas];
    nuevasParadas[index][campo] = valor;
    setParadas(nuevasParadas);
  };

  const handleGuardarCambios = async () => {
    try {
      const horasRegistradas = paradas
        .filter((p, i) => i > 0)
        .map(p => ({
          ciudad: p.ciudad,
          hora_llegada: p.hora_llegada,
          hora_salida: p.hora_salida
        }));
      
      await updateViaje(viajeId, {
        observaciones: `${viaje.observaciones || ''}\n\nHoras registradas:\n${JSON.stringify(horasRegistradas, null, 2)}`,
        paradas: paradas 
      });
      
      setEditando(false);
      alert('Cambios guardados exitosamente');
      loadViaje(); 
    } catch (err) {
      console.error(err);
      setError('Error al guardar cambios: ' + err.message);
    }
  };

  const handleFinalizarViaje = async () => {
    try {
      const ultimaParada = paradas[paradas.length - 1];
      
      if (!ultimaParada.hora_llegada) {
        alert('Debes registrar la hora de llegada al destino final');
        return;
      }
      
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
      'programado': 'bg-blue-100 text-blue-800 border-blue-200',
      'en_curso': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'completado': 'bg-green-100 text-green-800 border-green-200',
      'cancelado': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando detalles del viaje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <button onClick={onVolver} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium mb-6">
          <ArrowLeft size={20} /> Volver
        </button>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!viaje) return null;

  const asignacion = viaje.asignacion_turno || viaje.asignacionTurno || {};
  const bus = asignacion.bus || {};
  const conductores = asignacion.conductores || [];
  const asistentes = asignacion.asistentes || [];

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      
      {/* Botón Volver */}
      <div className="mb-6">
        <button 
          onClick={onVolver} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft size={20} /> 
          Volver a Viajes
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Hash className="text-slate-400" size={20} />
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  {viaje.codigo_viaje}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getEstadoColor(viaje.estado)}`}>
                  {viaje.estado}
                </span>
              </div>
              <p className="text-slate-300 text-lg flex items-center gap-2">
                <MapPin size={18} className="text-blue-400" />
                {viaje.ruta?.origen} <span className="text-slate-500">➜</span> {viaje.ruta?.destino}
              </p>
            </div>
            
            {viaje.estado === 'en_curso' && (
              <Button 
                variant="success" 
                size="lg" 
                onClick={handleFinalizarViaje}
                className="shadow-lg flex items-center gap-2"
              >
                <CheckCircle size={20} /> Finalizar Viaje
              </Button>
            )}
          </div>
        </div>
        <Map className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Grid de Información General */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Detalles Operativos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Info Bus */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <Bus size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bus Asignado</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {bus.patente || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                {bus.marca} {bus.modelo}
              </p>
            </div>
          </div>

          {/* Info Tripulación */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tripulación</p>
              <div className="mt-1 space-y-1">
                {conductores.map((c, i) => (
                  <div key={`cond-${i}`} className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Conductor"></div>
                    {c.empleado?.user?.nombre} {c.empleado?.user?.apellido}
                  </div>
                ))}
                
                {asistentes.map((a, i) => (
                    <div key={`asist-${i}`} className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Asistente"></div>
                    {a.empleado?.user?.nombre} {a.empleado?.user?.apellido}
                  </div>
                ))}

                {conductores.length === 0 && asistentes.length === 0 && (
                  <span className="text-sm text-gray-400 italic">Sin asignar</span>
                )}
              </div>
            </div>
          </div>

           {/* Info Horarios */}
           <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="p-3 bg-green-100 rounded-lg text-green-600">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha y Salida</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                 {new Date(viaje.fecha_hora_salida).toLocaleDateString('es-CL')}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                 <Clock size={14} />
                 {new Date(viaje.fecha_hora_salida).toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})} hrs
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Sección de Paradas y Tarifas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header de la sección */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="text-blue-600" size={24} />
            Itinerario y Tarifas ({paradas.length})
          </h2>

          <div className="flex items-center gap-2">
            {(viaje.estado === 'en_curso' || viaje.estado === 'programado') && !editando && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setEditando(true)}
                className="flex items-center gap-2"
              >
                <Edit2 size={16} /> Editar Datos
              </Button>
            )}
            
            {editando && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditando(false);
                    loadViaje(); 
                  }}
                  className="flex items-center gap-2"
                >
                  <X size={16} /> Cancelar
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleGuardarCambios}
                  className="flex items-center gap-2"
                >
                  <Save size={16} /> Guardar Todo
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Lista de Paradas */}
        <div className="divide-y divide-gray-100">
          {paradas.map((parada, index) => (
            <div 
              key={index} 
              className={`p-6 transition-colors duration-200 ${
                parada.es_origen || parada.es_destino ? 'bg-blue-50/30' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-5">
                {/* Número / Indicador */}
                <div className="flex-shrink-0 flex flex-col items-center">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm z-10
                      ${parada.es_origen ? 'bg-green-500 text-white' : 
                        parada.es_destino ? 'bg-red-500 text-white' : 'bg-white border-2 border-gray-300 text-gray-500'}`
                   }>
                      {index + 1}
                   </div>
                   {index < paradas.length - 1 && <div className="h-full w-0.5 bg-gray-200 my-1"></div>}
                </div>

                <div className="flex-1">
                  {/* Título Parada */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{parada.ciudad}</h3>
                    {parada.es_origen && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">ORIGEN</span>
                    )}
                    {parada.es_destino && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">DESTINO</span>
                    )}
                  </div>

                  {/* Info Distancia/Tiempo (Solo si no es origen) */}
                  {index > 0 && (
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                        📏 {parada.distancia_desde_anterior_km || 0} km
                      </span>
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                        ⏱️ {parada.tiempo_desde_anterior_min || 0} min
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* --- TARIFAS (Editables) --- */}
                    {!parada.es_origen && (
                      <div className={`border rounded-lg p-3 shadow-sm ${editando ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase border-b pb-1">Tarifas desde origen</p>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {/* Adulto */}
                          <div className="text-center">
                            <label className="block text-xs text-gray-500 mb-1">Adulto</label>
                            {editando ? (
                               <input 
                                type="number"
                                className="w-full text-center text-sm p-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                value={parada.tarifa_adulto}
                                onChange={(e) => actualizarParada(index, 'tarifa_adulto', e.target.value)}
                               />
                            ) : (
                               <span className="font-bold text-gray-800 block p-1 bg-gray-50 rounded">${(parada.tarifa_adulto || 0).toLocaleString('es-CL')}</span>
                            )}
                          </div>

                          {/* Estudiante */}
                          <div className="text-center">
                            <label className="block text-xs text-gray-500 mb-1">Estudiante</label>
                            {editando ? (
                               <input 
                                type="number"
                                className="w-full text-center text-sm p-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                value={parada.tarifa_estudiante}
                                onChange={(e) => actualizarParada(index, 'tarifa_estudiante', e.target.value)}
                               />
                            ) : (
                               <span className="font-bold text-gray-800 block p-1 bg-gray-50 rounded">${(parada.tarifa_estudiante || 0).toLocaleString('es-CL')}</span>
                            )}
                          </div>

                          {/* 3ra Edad */}
                          <div className="text-center">
                             <label className="block text-xs text-gray-500 mb-1">3ra Edad</label>
                             {editando ? (
                               <input 
                                type="number"
                                className="w-full text-center text-sm p-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                value={parada.tarifa_tercera_edad}
                                onChange={(e) => actualizarParada(index, 'tarifa_tercera_edad', e.target.value)}
                               />
                            ) : (
                               <span className="font-bold text-gray-800 block p-1 bg-gray-50 rounded">${(parada.tarifa_tercera_edad || 0).toLocaleString('es-CL')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* --- HORARIOS --- */}
                    {/* El recuadro es gris en origen (no editable), azul en los demás si se edita */}
                    <div className={`rounded-lg p-3 border ${editando && !parada.es_origen ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase border-b border-gray-200/50 pb-1">Registro de Horarios</p>
                        <div className="grid grid-cols-2 gap-4">
                        
                        {/* INPUT LLEGADA: Oculto en Origen */}
                        <div className={parada.es_origen ? 'invisible' : ''}>
                            <label className="text-xs text-gray-600 mb-1 block">Llegada</label>
                            {editando ? (
                            <input 
                                type="time" 
                                className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={parada.hora_llegada || ''}
                                onChange={(e) => actualizarParada(index, 'hora_llegada', e.target.value)}
                            />
                            ) : (
                            <span className="font-mono font-medium text-gray-900 block p-1 bg-white rounded text-center">
                                {parada.hora_llegada ? parada.hora_llegada.slice(0, 5) : '--:--'}
                            </span>
                            )}
                        </div>

                        {/* INPUT SALIDA: Oculto en Destino, NO editable en Origen */}
                        <div className={parada.es_destino ? 'invisible' : ''}>
                            <label className="text-xs text-gray-600 mb-1 block">Salida</label>
                            {editando && !parada.es_origen ? (
                            <input 
                                type="time" 
                                className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={parada.hora_salida || ''}
                                onChange={(e) => actualizarParada(index, 'hora_salida', e.target.value)}
                            />
                            ) : (
                            <span className="font-mono font-medium text-gray-900 block p-1 bg-white rounded text-center">
                                {parada.hora_salida ? parada.hora_salida.slice(0, 5) : '--:--'}
                            </span>
                            )}
                        </div>
                        </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}