import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Bus, MapPin, Filter, 
  ChevronDown, Eye, X, Search, User 
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { fetchMisTurnos, fetchViajesPorTurno } from '../../services/api';

export default function MisTurnosPage() {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Detalles
  const [turnoDetalle, setTurnoDetalle] = useState(null);
  const [viajesTurno, setViajesTurno] = useState([]);
  const [loadingViajes, setLoadingViajes] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    estado: '',
    mostrar_todos: false
  });

  useEffect(() => { loadTurnos(); }, []);

  const loadTurnos = async (customFilters = null) => {
    try {
      setLoading(true);
      const filtersToUse = customFilters || filters;
      const data = await fetchMisTurnos(filtersToUse);
      setTurnos(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error cargando turnos:', err);
      setError(err.message);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => loadTurnos(filters);
  
  const clearFilters = () => {
    const emptyFilters = { fecha_inicio: '', fecha_fin: '', estado: '', mostrar_todos: false };
    setFilters(emptyFilters);
    loadTurnos(emptyFilters);
  };

  const handleVerDetalle = async (turno) => {
    setTurnoDetalle(turno);
    setLoadingViajes(true);
    try {
      const viajes = await fetchViajesPorTurno(turno.id);
      setViajesTurno(viajes);
    } catch (err) {
      console.error('Error cargando viajes:', err);
      setViajesTurno([]);
    } finally {
      setLoadingViajes(false);
    }
  };

  // --- HELPERS VISUALES ---
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : '';

  const getEstadoColor = (estado) => ({
    'programado': 'bg-blue-50 text-blue-700 border-blue-200',
    'en_curso': 'bg-amber-50 text-amber-700 border-amber-200',
    'completado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'cancelado': 'bg-red-50 text-red-700 border-red-200',
  }[estado] || 'bg-gray-50 text-gray-700 border-gray-200');

  const isToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString?.split('T')[0] === today;
  };

  if (loading && turnos.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-slate-800">
      
      {/* === HEADER CARD === */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Mis Turnos</h1>
          <p className="mt-2 text-slate-300 max-w-xl">Gestiona tu agenda y revisa tus asignaciones de viaje.</p>
        </div>
        <CalendarIcon className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* === FILTROS === */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Filter size={20} className="text-blue-600" />
            Filtrar Turnos
          </div>
          <ChevronDown size={20} className={`text-slate-400 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input label="Desde" type="date" value={filters.fecha_inicio} onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)} />
              <Input label="Hasta" type="date" value={filters.fecha_fin} onChange={(e) => handleFilterChange('fecha_fin', e.target.value)} />
              <Select 
                label="Estado" 
                options={[
                  { id: '', label: 'Todos' },
                  { id: 'programado', label: 'Programado' },
                  { id: 'en_curso', label: 'En Curso' },
                  { id: 'completado', label: 'Completado' },
                  { id: 'cancelado', label: 'Cancelado' },
                ]}
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
              />
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={filters.mostrar_todos} onChange={(e) => handleFilterChange('mostrar_todos', e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <span className="text-sm text-slate-600">Incluir historial pasado</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200/50">
              <Button variant="primary" size="sm" onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                <Search size={16} className="mr-2"/> Buscar
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters} className="border-slate-300 text-slate-600 hover:bg-white">
                Limpiar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* === LISTA DE TURNOS (GRID) === */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
          <X size={20} /> {error}
        </div>
      )}

      {turnos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
          <CalendarIcon size={64} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">Sin asignaciones</h3>
          <p className="text-slate-500">
            {filters.mostrar_todos ? 'No hay resultados con los filtros actuales.' : 'No tienes turnos programados próximamente.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {turnos.map((turno) => {
            const today = isToday(turno.fecha_turno);
            return (
              <div 
                key={turno.id} 
                className={`group relative bg-white rounded-2xl p-5 border shadow-sm hover:shadow-lg transition-all duration-300 ${
                  today ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'
                }`}
              >
                {/* Header Card */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shadow-sm border ${today ? 'bg-blue-100 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                      <Bus size={24} className={today ? 'text-blue-600' : 'text-slate-600'} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg leading-tight">{turno.bus?.patente || 'S/P'}</p>
                      <p className="text-xs text-slate-500 font-medium">{turno.bus?.modelo}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${getEstadoColor(turno.estado)}`}>
                    {turno.estado.replace('_', ' ')}
                  </span>
                </div>

                {/* Body Card */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-2 rounded-lg">
                    <CalendarIcon size={18} className="text-slate-400" />
                    <span className="font-semibold text-sm capitalize">{formatDate(turno.fecha_turno)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-600 px-2">
                    <Clock size={18} className="text-slate-400" />
                    <span className="text-sm font-medium">{formatTime(turno.hora_inicio)} - {formatTime(turno.hora_termino)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 px-2">
                    <User size={18} className="text-slate-400" />
                    <span className="text-sm">Rol: <span className="font-semibold text-blue-600 capitalize">{turno.mi_rol || 'Principal'}</span></span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 px-2">
                    <MapPin size={18} className="text-slate-400" />
                    <span className="text-sm">{turno.viajes?.length || 0} Viajes programados</span>
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                   {today && <span className="text-xs font-bold text-blue-600 animate-pulse">● Turno de Hoy</span>}
                   {!today && <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{turno.tipo_turno}</span>}
                   
                   <button 
                    onClick={() => handleVerDetalle(turno)}
                    className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-200"
                   >
                     Ver Detalle <Eye size={16} />
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* === MODAL DETALLE === */}
      {turnoDetalle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Detalle del Turno</h2>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{turnoDetalle.bus?.patente} • {formatDate(turnoDetalle.fecha_turno)}</p>
              </div>
              <button onClick={() => setTurnoDetalle(null)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-bold uppercase mb-1">Horario</p>
                  <p className="font-mono text-slate-700 font-semibold">{formatTime(turnoDetalle.hora_inicio)} - {formatTime(turnoDetalle.hora_termino)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Tu Rol</p>
                  <p className="text-slate-700 font-semibold capitalize">{turnoDetalle.mi_rol || 'Principal'}</p>
                </div>
              </div>

              {/* Tripulación */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <User size={16} /> Tripulación
                </h3>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {turnoDetalle.conductores?.map((c, i) => (
                    <div key={i} className="px-4 py-3 flex justify-between items-center text-sm">
                      <span className="text-slate-700 font-medium">{c.empleado?.user?.nombre} {c.empleado?.user?.apellido}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-slate-500 capitalize">{c.pivot?.rol}</span>
                    </div>
                  ))}
                  {turnoDetalle.asistentes?.map((a, i) => (
                    <div key={`a-${i}`} className="px-4 py-3 flex justify-between items-center text-sm">
                       <span className="text-slate-700 font-medium">{a.empleado?.user?.nombre} {a.empleado?.user?.apellido}</span>
                       <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded capitalize">Asistente</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Viajes */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <MapPin size={16} /> Rutas Asignadas
                </h3>
                
                {loadingViajes ? (
                  <div className="py-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
                ) : viajesTurno.length === 0 ? (
                  <div className="text-center p-4 bg-gray-50 rounded-xl text-slate-500 text-sm">No hay viajes registrados.</div>
                ) : (
                  <div className="space-y-2">
                    {viajesTurno.map((viaje) => (
                      <div key={viaje.id} className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-700 text-sm">{viaje.ruta?.nombre_ruta || viaje.nombre_viaje}</p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <Clock size={12}/> Salida: {new Date(viaje.fecha_hora_salida).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${getEstadoColor(viaje.estado)}`}>
                          {viaje.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observaciones */}
              {turnoDetalle.observaciones && (
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800">
                    <strong className="block text-amber-900 mb-1">Notas:</strong>
                    {turnoDetalle.observaciones}
                 </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
               <Button variant="secondary" onClick={() => setTurnoDetalle(null)} className="w-full justify-center">Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}