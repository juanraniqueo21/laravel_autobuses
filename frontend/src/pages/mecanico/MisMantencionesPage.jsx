import React, { useState, useEffect } from 'react';
import { 
  Wrench, Clock, Bus, Calendar, Filter, ChevronDown, Eye, 
  CheckCircle, XCircle, AlertCircle, Search, Hammer,
  Grid, List, ChevronLeft, ChevronRight
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { fetchMisMantenciones } from '../../services/api';

// Función auxiliar para fechas
const formatDateLong = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
};

export default function MisMantencionesPage() {
  const [mantenciones, setMantenciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [detalle, setDetalle] = useState(null);

  // Estados para Vista (Lista / Calendario)
  const [viewMode, setViewMode] = useState('list'); 
  const [currentDate, setCurrentDate] = useState(new Date());

  const [filters, setFilters] = useState({
    estado: ''
  });

  useEffect(() => { loadMantenciones(); }, []);

  const loadMantenciones = async (customFilters = null) => {
    try {
      setLoading(true);
      const filtersToUse = customFilters || filters;
      const response = await fetchMisMantenciones(filtersToUse);
      
      // --- CORRECCIÓN AQUÍ ---
      // Verificamos si la respuesta es un array directo o si viene dentro de .data
      const listaMantenciones = Array.isArray(response) ? response : (response.data || []);
      
      setMantenciones(listaMantenciones);
      setError(null);
    } catch (err) {
      console.error('Error cargando mantenciones:', err);
      setError(err.message);
      setMantenciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => loadMantenciones(filters);
  
  const clearFilters = () => {
    const emptyFilters = { estado: '' };
    setFilters(emptyFilters);
    loadMantenciones(emptyFilters);
  };

  const getEstadoConfig = (estado) => {
    const configs = {
      'pendiente': { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle, label: 'Pendiente' },
      'en_proceso': { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Hammer, label: 'En Proceso' },
      'completado': { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Completado' },
      'cancelado': { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: XCircle, label: 'Cancelado' },
    };
    return configs[estado] || configs['pendiente'];
  };

  // --- LÓGICA CALENDARIO GRANDE (Mensual) ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1; 
    return { days, firstDay: firstDayAdjusted };
  };

  const changeMonth = (increment) => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + increment)));
  };

  const renderBigCalendar = () => {
    const { days, firstDay } = getDaysInMonth(currentDate);
    const daysArray = [...Array(days).keys()].map(i => i + 1);
    const emptyDays = [...Array(firstDay).keys()];

    // Filtrar mantenciones del mes actual
    const monthMantenciones = mantenciones.filter(m => {
      if (!m.fecha_programada) return false;
      const tDate = new Date(m.fecha_programada);
      return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
    });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-full transition-all text-slate-600"><ChevronLeft size={20}/></button>
          <h3 className="text-lg font-bold text-gray-800 capitalize">
            {currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-full transition-all text-slate-600"><ChevronRight size={20}/></button>
        </div>
        
        <div className="grid grid-cols-7 bg-gray-100 text-center text-xs font-bold text-gray-500 uppercase py-3 border-b border-gray-200">
          <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
        </div>

        <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-50/50 min-h-[120px]"></div>
          ))}
          {daysArray.map(day => {
            const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayMantenciones = monthMantenciones.filter(m => new Date(m.fecha_programada).getDate() === day);
            const isTodayVal = new Date().toDateString() === currentDayDate.toDateString();
            
            return (
              <div key={day} className={`bg-white min-h-[120px] p-2 transition-colors hover:bg-blue-50/30 flex flex-col ${isTodayVal ? 'bg-blue-50/20' : ''}`}>
                <div className={`text-sm font-bold mb-2 ${isTodayVal ? 'text-blue-600' : 'text-gray-400'}`}>
                  {isTodayVal ? <span className="bg-blue-100 px-2 py-1 rounded-full">{day}</span> : day}
                </div>
                <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                  {dayMantenciones.map((mant, idx) => {
                    const config = getEstadoConfig(mant.estado);
                    return (
                        <div 
                            key={idx} 
                            onClick={() => setDetalle(mant)}
                            className={`text-[10px] p-1.5 rounded border cursor-pointer hover:opacity-80 transition-opacity ${config.color}`}
                            title={`${mant.tipo_mantenimiento} - ${mant.bus?.patente}`}
                        >
                        <div className="font-bold truncate capitalize">{mant.tipo_mantenimiento}</div>
                        <div className="truncate font-medium mt-0.5">{mant.bus?.patente || 'S/P'}</div>
                        </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- RENDERIZADO LISTA ---
  const mantencionesAgrupadas = mantenciones.reduce((acc, mant) => {
    const fecha = mant.fecha_programada?.split('T')[0] || 'sin-fecha';
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(mant);
    return acc;
  }, {});

  if (loading && mantenciones.length === 0) {
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
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mis Trabajos</h1>
                <p className="mt-2 text-slate-300 max-w-xl">Historial y programación de mantenimientos asignados.</p>
            </div>
        </div>
        <Wrench className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3 animate-in fade-in">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* BARRA DE CONTROLES: FILTROS Y VISTA */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        
        {/* FILTROS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 overflow-hidden">
            <button onClick={() => setShowFilters(!showFilters)} className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Filter size={20} className="text-blue-600" /> Filtrar Trabajos
              </div>
              <ChevronDown size={20} className={`text-slate-400 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/50 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select 
                        label="Estado" 
                        options={[
                          { id: '', label: 'Todos' }, 
                          { id: 'pendiente', label: 'Pendiente' }, 
                          { id: 'en_proceso', label: 'En Proceso' }, 
                          { id: 'completado', label: 'Completado' }
                        ]}
                        value={filters.estado}
                        onChange={(e) => handleFilterChange('estado', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200/50">
                    <Button variant="primary" size="sm" onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700 text-white"><Search size={16} className="mr-2"/> Buscar</Button>
                    <Button variant="outline" size="sm" onClick={clearFilters} className="border-slate-300 text-slate-600">Limpiar</Button>
                  </div>
              </div>
            )}
        </div>

        {/* SELECTOR DE VISTA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex items-center gap-1 h-fit">
            <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <List size={18} /> Lista
            </button>
            <button 
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Grid size={18} /> Calendario
            </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: LISTA O CALENDARIO */}
      {viewMode === 'calendar' ? renderBigCalendar() : (
        <>
            {/* LISTA DE TRABAJOS */}
            {mantenciones.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
                  <Wrench size={64} className="mx-auto text-slate-200 mb-4" />
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Sin asignaciones</h3>
                  <p className="text-slate-500">No se encontraron mantenimientos con los filtros actuales.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Object.entries(mantencionesAgrupadas).sort(([a], [b]) => new Date(a) - new Date(b)).map(([fecha, listaDia]) => (
                         <div key={fecha} className="contents">
                            <div className="col-span-full flex items-center gap-3 px-2 mt-4 first:mt-0">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-700"><Calendar size={20} /></div>
                                <div>
                                <h3 className="font-bold text-slate-800 capitalize">
                                    {formatDateLong(fecha)}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">{listaDia.length} trabajos</p>
                                </div>
                            </div>
                            
                            {listaDia.map((mant) => {
                                const estadoConfig = getEstadoConfig(mant.estado);
                                const isToday = new Date(mant.fecha_programada).toDateString() === new Date().toDateString();

                                return (
                                    <div 
                                        key={mant.id} 
                                        className={`group relative bg-white rounded-2xl p-5 border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${isToday ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'}`}
                                        onClick={() => setDetalle(mant)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl shadow-sm border ${isToday ? 'bg-blue-100 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                                                <Bus size={24} className={isToday ? 'text-blue-600' : 'text-slate-600'} />
                                                </div>
                                                <div>
                                                <p className="font-bold text-slate-800 text-lg leading-tight">{mant.bus?.patente || 'S/P'}</p>
                                                <p className="text-xs text-slate-500 font-medium">{mant.bus?.modelo}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${estadoConfig.color}`}>
                                                <estadoConfig.icon size={12}/> {estadoConfig.label}
                                            </span>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-2 rounded-lg">
                                                <Calendar size={18} className="text-slate-400" />
                                                <span className="font-semibold text-sm capitalize">{formatDateLong(mant.fecha_programada)}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 text-slate-600 px-2">
                                                <Wrench size={18} className="text-slate-400" />
                                                <span className="text-sm font-medium capitalize">{mant.tipo_mantenimiento}</span>
                                            </div>
                                            
                                            <div className="flex items-start gap-3 text-slate-600 px-2">
                                                <Eye size={18} className="text-slate-400 mt-0.5" />
                                                <span className="text-sm line-clamp-2">{mant.descripcion || "Sin descripción."}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                            {isToday && <span className="text-xs font-bold text-blue-600 animate-pulse">● Programado para Hoy</span>}
                                            {!isToday && <span className="text-xs text-slate-400 font-medium">ID #{mant.id}</span>}
                                            
                                            <button className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-200">
                                                Ver Detalle <Eye size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                    ))}
                </div>
            )}
        </>
      )}

      {/* MODAL DETALLE */}
      {detalle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Detalle de Trabajo</h2>
                <p className="text-xs text-slate-500 font-mono">Orden #{detalle.id}</p>
              </div>
              <button onClick={() => setDetalle(null)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 text-slate-500 transition-colors"><XCircle size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 capitalize">{detalle.tipo_mantenimiento}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getEstadoConfig(detalle.estado).color}`}>
                   {getEstadoConfig(detalle.estado).label}
                </span>
              </div>

              {detalle.bus && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                   <div className="bg-white p-3 rounded-xl text-blue-600 shadow-sm">
                     <Bus size={32}/>
                   </div>
                   <div>
                     <p className="text-xs text-blue-600 font-bold uppercase mb-0.5">Unidad Asignada</p>
                     <p className="text-xl font-bold text-slate-800">{detalle.bus.patente}</p>
                     <p className="text-sm text-slate-600">{detalle.bus.marca} - {detalle.bus.modelo}</p>
                   </div>
                </div>
              )}

              <div>
                 <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Clock size={16}/> Programación</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                       <p className="text-xs text-slate-400 font-bold uppercase">Fecha Inicio</p>
                       <p className="text-slate-800 font-medium">{formatDateLong(detalle.fecha_programada)}</p>
                    </div>
                    {detalle.fecha_realizacion && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                         <p className="text-xs text-green-600 font-bold uppercase">Realizado el</p>
                         <p className="text-green-800 font-medium">{formatDateLong(detalle.fecha_realizacion)}</p>
                      </div>
                    )}
                 </div>
              </div>

              <div>
                 <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Eye size={16}/> Descripción del Trabajo</h4>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
                    {detalle.descripcion || "Sin descripción proporcionada."}
                 </div>
              </div>

              {detalle.costo > 0 && (
                 <div className="flex justify-end">
                    <div className="text-right">
                       <p className="text-xs text-slate-400 font-bold uppercase">Costo Registrado</p>
                       <p className="text-xl font-bold text-slate-800">${parseInt(detalle.costo).toLocaleString('es-CL')}</p>
                    </div>
                 </div>
              )}

            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50">
               <Button variant="secondary" onClick={() => setDetalle(null)} className="w-full justify-center">Cerrar Detalle</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}