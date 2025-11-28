import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Bus, Calendar, Filter, ChevronDown, Eye, 
  CheckCircle, XCircle, AlertCircle, Search
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { fetchMisViajesAsistente } from '../../services/api';
import { formatTime, formatDateLong } from '../../utils/dateHelpers';

export default function MisViajesAsistentePage() {
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viajeDetalle, setViajeDetalle] = useState(null);

  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    estado: ''
  });

  useEffect(() => { loadViajes(); }, []);

  const loadViajes = async (customFilters = null) => {
    try {
      setLoading(true);
      const filtersToUse = customFilters || filters;
      const data = await fetchMisViajesAsistente(filtersToUse);
      setViajes(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setViajes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => loadViajes(filters);
  
  const clearFilters = () => {
    const emptyFilters = { fecha_inicio: '', fecha_fin: '', estado: '' };
    setFilters(emptyFilters);
    loadViajes(emptyFilters);
  };

  const getEstadoConfig = (estado) => {
    const configs = {
      'programado': { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock, label: 'Programado' },
      'en_curso': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: AlertCircle, label: 'En Curso' },
      'completado': { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Completado' },
      'cancelado': { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Cancelado' },
    };
    return configs[estado] || configs['programado'];
  };

  const calcularDuracion = (salida, llegada) => {
    if (!salida || !llegada) return null;
    const diff = new Date(llegada) - new Date(salida);
    const minutos = Math.round(diff / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return horas > 0 ? `${horas}h ${mins}m` : `${mins} min`;
  };

  const viajesAgrupados = viajes.reduce((acc, viaje) => {
    const fecha = viaje.fecha_hora_salida?.split('T')[0] || 'sin-fecha';
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(viaje);
    return acc;
  }, {});

  if (loading && viajes.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-slate-800">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Mis Viajes (Asistente)</h1>
          <p className="mt-2 text-slate-300 max-w-xl">Historial y programación de tus rutas asignadas.</p>
        </div>
        <MapPin className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* RESUMEN RÁPIDO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
          <span className="text-3xl font-bold text-slate-800">{viajes.length}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Total</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
          <span className="text-3xl font-bold text-green-600">{viajes.filter(v => v.estado === 'completado').length}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Completados</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
          <span className="text-3xl font-bold text-yellow-600">{viajes.filter(v => v.estado === 'en_curso').length}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">En Curso</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
          <span className="text-3xl font-bold text-blue-600">{viajes.filter(v => v.estado === 'programado').length}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Programados</span>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <button onClick={() => setShowFilters(!showFilters)} className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Filter size={20} className="text-green-600" /> Filtrar Historial
          </div>
          <ChevronDown size={20} className={`text-slate-400 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Desde" type="date" value={filters.fecha_inicio} onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)} />
              <Input label="Hasta" type="date" value={filters.fecha_fin} onChange={(e) => handleFilterChange('fecha_fin', e.target.value)} />
              <Select 
                label="Estado" 
                options={[{ id: '', label: 'Todos' }, { id: 'programado', label: 'Programado' }, { id: 'en_curso', label: 'En Curso' }, { id: 'completado', label: 'Completado' }, { id: 'cancelado', label: 'Cancelado' }]}
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
              />
            </div>
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200/50">
              <Button variant="primary" size="sm" onClick={applyFilters} className="bg-green-600 hover:bg-green-700 text-white"><Search size={16} className="mr-2"/> Buscar</Button>
              <Button variant="outline" size="sm" onClick={clearFilters} className="border-slate-300 text-slate-600">Limpiar</Button>
            </div>
          </div>
        )}
      </div>

      {/* LISTA DE VIAJES */}
      {viajes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
          <MapPin size={64} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No tienes viajes</h3>
          <p className="text-slate-500">No se encontraron registros con los filtros actuales.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(viajesAgrupados).sort(([a], [b]) => new Date(b) - new Date(a)).map(([fecha, viajesDia]) => (
            <div key={fecha} className="space-y-4">
              {/* Fecha Header */}
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 bg-green-100 rounded-lg text-green-700"><Calendar size={20} /></div>
                <div>
                  <h3 className="font-bold text-slate-800 capitalize">
                    {formatDateLong(fecha)}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{viajesDia.length} viajes</p>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {viajesDia.map((viaje) => {
                  const estadoConfig = getEstadoConfig(viaje.estado);
                  const EstadoIcon = estadoConfig.icon;
                  const duracion = calcularDuracion(viaje.fecha_hora_salida, viaje.fecha_hora_llegada);

                  return (
                    <div key={viaje.id} className="group bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
                      <div>
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs font-mono text-slate-400 mb-1">#{viaje.codigo_viaje}</p>
                            <h4 className="font-bold text-slate-800 text-lg leading-tight">{viaje.ruta?.nombre_ruta || viaje.nombre_viaje || 'Viaje'}</h4>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${estadoConfig.color}`}>
                            {estadoConfig.label}
                          </span>
                        </div>

                        {/* Card Body */}
                        <div className="space-y-3 mb-4">
                           <div className="flex justify-between items-center text-sm">
                              <div className="flex flex-col">
                                <span className="text-slate-400 text-xs uppercase font-bold">Salida</span>
                                <span className="text-slate-700 font-mono font-semibold text-lg">{formatTime(viaje.fecha_hora_salida)}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-slate-400 text-xs uppercase font-bold">Llegada</span>
                                <span className="text-slate-700 font-mono font-semibold text-lg">{viaje.fecha_hora_llegada ? formatTime(viaje.fecha_hora_llegada) : '--:--'}</span>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                              <Clock size={14}/> Duración estimada: <span className="font-semibold text-slate-700">{duracion || 'En proceso'}</span>
                           </div>

                           {viaje.asignacionTurno?.bus && (
                             <div className="flex items-center gap-2 text-xs text-slate-600">
                               <Bus size={14} className="text-green-600"/>
                               <span className="font-bold">{viaje.asignacionTurno.bus.patente}</span>
                               <span className="text-slate-400">|</span>
                               <span>{viaje.asignacionTurno.bus.modelo}</span>
                             </div>
                           )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                         {(viaje.incidentes) ? (
                            <span className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertCircle size={12}/> Incidente reportado</span>
                         ) : (viaje.observaciones) ? (
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><CheckCircle size={12}/> Con observaciones</span>
                         ) : <span></span>}

                         <Button variant="secondary" size="sm" onClick={() => setViajeDetalle(viaje)} className="text-xs h-8">
                           Ver Detalle <Eye size={14} className="ml-1.5"/>
                         </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETALLE */}
      {viajeDetalle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Detalle del Viaje</h2>
                <p className="text-xs text-slate-500 font-mono">#{viajeDetalle.codigo_viaje}</p>
              </div>
              <button onClick={() => setViajeDetalle(null)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 text-slate-500"><XCircle size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">{viajeDetalle.ruta?.nombre_ruta || viajeDetalle.nombre_viaje}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getEstadoConfig(viajeDetalle.estado).color}`}>
                   {getEstadoConfig(viajeDetalle.estado).label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
                   <p className="text-xs text-green-600 uppercase font-bold mb-1">Salida Real</p>
                   <p className="text-2xl font-bold text-slate-800 font-mono">{formatTime(viajeDetalle.fecha_hora_salida)}</p>
                   <p className="text-xs text-slate-500">{new Date(viajeDetalle.fecha_hora_salida).toLocaleDateString('es-CL')}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-gray-200 text-center">
                   <p className="text-xs text-slate-500 uppercase font-bold mb-1">Llegada</p>
                   <p className="text-2xl font-bold text-slate-800 font-mono">{viajeDetalle.fecha_hora_llegada ? formatTime(viajeDetalle.fecha_hora_llegada) : '--:--'}</p>
                   {viajeDetalle.fecha_hora_llegada && <p className="text-xs text-slate-500">{new Date(viajeDetalle.fecha_hora_llegada).toLocaleDateString('es-CL')}</p>}
                </div>
              </div>

              {viajeDetalle.ruta?.paradas?.length > 0 && (
                <div>
                   <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><MapPin size={16}/> Ruta y Paradas</h4>
                   <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      {viajeDetalle.ruta.paradas.sort((a, b) => a.orden - b.orden).map((parada, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                           <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">{parada.orden}</span>
                           <span className="font-medium text-slate-700 flex-1">{parada.ciudad}</span>
                           {parada.distancia_desde_anterior_km > 0 && <span className="text-xs text-slate-400">+{parada.distancia_desde_anterior_km} km</span>}
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {(viajeDetalle.observaciones || viajeDetalle.incidentes) && (
                <div className="space-y-3">
                   {viajeDetalle.observaciones && (
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-900">
                        <strong className="block mb-1 flex items-center gap-2"><Eye size={14}/> Observaciones</strong>
                        {viajeDetalle.observaciones}
                     </div>
                   )}
                   {viajeDetalle.incidentes && (
                     <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-sm text-red-900">
                        <strong className="block mb-1 flex items-center gap-2"><AlertCircle size={14}/> Incidentes</strong>
                        {viajeDetalle.incidentes}
                     </div>
                   )}
                </div>
              )}

            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50">
               <Button variant="secondary" onClick={() => setViajeDetalle(null)} className="w-full justify-center">Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}