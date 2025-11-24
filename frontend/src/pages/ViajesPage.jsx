import React, { useState, useEffect } from 'react';
import { Calendar, Activity } from 'lucide-react';
import TurnoViajesPage from './TurnoViajesPage';
import { fetchTurnos, fetchViajesPorTurno } from '../services/api';
import { Clock, Bus, Users, ChevronRight } from 'lucide-react'; // Asegúrate de importar estos si los usas en el render

export default function ViajesPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => { loadTurnos(); }, [fechaSeleccionada]);

  const loadTurnos = async () => {
    try {
      setLoading(true);
      const turnosData = await fetchTurnos({ fecha: fechaSeleccionada });

      // VALIDACIÓN 1: Asegurarse de que sea un array
      if (!Array.isArray(turnosData)) {
        console.warn("La API no devolvió un array de turnos:", turnosData);
        setTurnos([]);
        return;
      }

      const turnosConViajes = await Promise.all(
        turnosData.map(async (turno) => {
          // VALIDACIÓN 2: Asegurarse de que el turno y su ID existan
          if (!turno || !turno.id) {
            return null;
          }

          try {
            const viajes = await fetchViajesPorTurno(turno.id);
            // Validación extra por si viajes es null/undefined
            const viajesArray = Array.isArray(viajes) ? viajes : [];
            
            return {
              ...turno,
              cantidad_viajes: viajesArray.length,
              viajes_completados: viajesArray.filter(v => v.estado === 'completado').length,
              viajes_en_curso: viajesArray.filter(v => v.estado === 'en_curso').length
            };
          } catch (err) {
            return { ...turno, cantidad_viajes: 0, viajes_completados: 0, viajes_en_curso: 0 };
          }
        })
      );

      // Filtrar nulos si hubo errores en el map y ordenar
      const validTurnos = turnosConViajes.filter(t => t !== null);
      validTurnos.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      
      setTurnos(validTurnos);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      setError('Error al cargar turnos: ' + err.message);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTurnos = turnos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(turnos.length / itemsPerPage);

  const getEstadoStyles = (estado) => {
    const styles = {
      'programado': 'bg-blue-50 text-blue-700 border-blue-200',
      'en_curso': 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
      'completado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'cancelado': 'bg-red-50 text-red-700 border-red-200',
    };
    return styles[estado] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // VALIDACIÓN 3: Asegurarse de que turnoSeleccionado tenga datos antes de renderizar el componente hijo
  if (turnoSeleccionado && turnoSeleccionado.id) {
    return (
      <TurnoViajesPage 
        turno={turnoSeleccionado} 
        onVolver={() => { 
          setTurnoSeleccionado(null); 
          loadTurnos(); 
        }} 
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
      
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Control de Viajes</h1>
          <p className="mt-2 text-slate-300 max-w-xl">Gestión operativa de turnos y asignación de viajes.</p>
        </div>
        <Activity className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group w-full sm:w-auto">
          <div className="p-2 bg-white text-blue-600 rounded-md shadow-sm group-hover:text-blue-700">
            <Calendar size={18} />
          </div>
          <div className="relative flex-1 sm:flex-none">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha Operación</label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="border-none bg-transparent p-0 text-sm font-bold text-gray-800 focus:ring-0 cursor-pointer w-full sm:w-32 outline-none"
            />
          </div>
        </div>
        <button onClick={() => setFechaSeleccionada(new Date().toISOString().split('T')[0])} className="text-xs font-bold text-blue-600 hover:underline whitespace-nowrap">
          Ir a Hoy
        </button>
      </div>

      {turnos.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <Calendar className="h-10 w-10 text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">Sin turnos</h3>
          <p className="text-gray-500">No hay actividad programada.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {currentTurnos.map((turno) => (
            <div key={turno.id} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/50">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 capitalize">{turno.tipo_turno}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getEstadoStyles(turno.estado)}`}>{turno.estado}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 mb-2">
                    <Clock size={18} className="text-blue-500" />
                    <span className="font-mono text-lg font-semibold">{turno.hora_inicio.slice(0, 5)} → {turno.hora_termino.slice(0, 5)}</span>
                  </div>
                </div>
                
                <div className="p-6 lg:w-1/2 grid grid-cols-2 gap-6">
                   <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Bus size={12}/> Bus</p>
                      <p className="text-lg font-bold text-gray-900">{turno.bus?.patente || '---'}</p>
                      <p className="text-xs text-gray-500">{turno.bus?.marca}</p>
                   </div>
                   <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><Users size={12}/> Tripulación</p>
                      <p className="text-lg font-bold text-gray-900">{turno.conductores?.length || 0}</p>
                      <p className="text-xs text-gray-500">Personas</p>
                   </div>
                </div>

                <div className="p-6 lg:w-1/6 flex items-center justify-end">
                  <button onClick={() => setTurnoSeleccionado(turno)} className="w-full bg-white border border-gray-200 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all">
                    Gestionar <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
            className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages}
            className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}