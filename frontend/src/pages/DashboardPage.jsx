import React, { useState, useEffect } from 'react';
import { 
  Bus, MapPin, Users, Wrench, TrendingUp, AlertCircle, CheckCircle, Clock, 
  ArrowRight, Activity, Bell, ChevronDown, ChevronUp, FileText, Calendar, AlertTriangle, X
} from 'lucide-react';
import { 
  fetchBuses, 
  fetchRutas, 
  fetchTurnos, 
  fetchViajesPorTurno,
  fetchMantenimientos, 
  fetchReportes,       
  fetchConductores,
  fetchLicencias, 
  fetchEmpleados
} from '../services/api';
import { LICENCIAS_ACTUALIZADAS_EVENT } from '../utils/licenseEvents';

export default function DashboardPage({ onNavigate }) {
  // --- ESTADOS ---
  const [stats, setStats] = useState({
    busesTotal: 0,
    busesOperativos: 0,
    busesMantenimiento: 0,
    rutasActivas: 0,
    viajesHoy: 0,
    viajesCompletadosHoy: 0,
    reportesPendientes: 0,
    personalEnLicencia: 0,
    mantenimientosActivos: 0
  });

  const [turnosDelDia, setTurnosDelDia] = useState([]);
  const [alertas, setAlertas] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [isAlertasOpen, setIsAlertasOpen] = useState(false);

  // --- ESTADOS PARA MODALES ---
  const [busesEnTaller, setBusesEnTaller] = useState([]);
  const [showModalMantenimiento, setShowModalMantenimiento] = useState(false);
  
  const [personalAusenteList, setPersonalAusenteList] = useState([]);
  const [showModalLicencias, setShowModalLicencias] = useState(false);

  // Estado auxiliar para cruzar datos de empleados
  const [listaEmpleados, setListaEmpleados] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const handleLicenciasActualizadas = () => loadDashboardData();
    window.addEventListener(LICENCIAS_ACTUALIZADAS_EVENT, handleLicenciasActualizadas);
    return () => window.removeEventListener(LICENCIAS_ACTUALIZADAS_EVENT, handleLicenciasActualizadas);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Obtenemos la fecha local actual en formato YYYY-MM-DD
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const [
        buses, 
        rutas, 
        turnosHoy, 
        mantenimientos, 
        reportes, 
        conductores,
        todasLasLicencias,
        todosLosEmpleados
      ] = await Promise.all([
        fetchBuses(),
        fetchRutas(),
        fetchTurnos({ fecha: today }),
        fetchMantenimientos(),
        fetchReportes(),
        fetchConductores(),
        fetchLicencias(),
        fetchEmpleados()
      ]);

      setListaEmpleados(todosLosEmpleados);

      // 1. PROCESAMIENTO FLOTA
      const operativos = buses.filter(b => b.estado === 'operativo' || b.estado === 'activo').length;
      const listaMantenimiento = buses.filter(b => b.estado === 'mantenimiento');
      setBusesEnTaller(listaMantenimiento);

      // 2. PROCESAMIENTO VIAJES
      let totalViajes = 0;
      let completados = 0;

      const turnosEnriquecidos = await Promise.all(turnosHoy.map(async (turno) => {
        try {
          const viajes = await fetchViajesPorTurno(turno.id);
          totalViajes += viajes.length;
          const completadosTurno = viajes.filter(v => v.estado === 'completado').length;
          completados += completadosTurno;
          
          const progreso = viajes.length > 0 ? Math.round((completadosTurno / viajes.length) * 100) : 0;

          return { 
            ...turno, 
            viajesTotales: viajes.length, 
            viajesCompletados: completadosTurno, 
            progreso 
          };
        } catch (e) {
          return { ...turno, viajesTotales: 0, viajesCompletados: 0, progreso: 0 };
        }
      }));

      turnosEnriquecidos.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

      // 3. PROCESAMIENTO GERENCIAL
      const reportesPendientes = reportes.filter(r => r.estado === 'pendiente').length;
      const mantActivos = mantenimientos.filter(m => m.estado === 'en_proceso').length;
      
      // --- LOGICA DE FILTRADO DE LICENCIAS ACTIVAS (CORREGIDA) ---
      // Comparamos strings YYYY-MM-DD directamente para evitar problemas de hora/zona horaria
      
      // A) Filtrar las activas
      const licenciasActivas = todasLasLicencias.filter(l => {
          // Extraemos solo la parte YYYY-MM-DD
          const inicioStr = l.fecha_inicio ? l.fecha_inicio.substring(0, 10) : '';
          const finStr = l.fecha_termino ? l.fecha_termino.substring(0, 10) : '';
          
          // Comparación alfanumérica de fechas ISO funciona correctamente
          // "2025-12-15" >= "2025-12-15" es true
          return l.estado === 'aprobado' && today >= inicioStr && today <= finStr;
      });

      // B) Cruzar con empleados para asegurar el nombre
      const licenciasEnriquecidas = licenciasActivas.map(licencia => {
          const empleadoEncontrado = todosLosEmpleados.find(e => e.id === licencia.empleado_id);
          
          let nombreCompleto = 'Funcionario Desconocido';
          let cargo = 'Sin cargo';

          if (empleadoEncontrado && empleadoEncontrado.user) {
             nombreCompleto = `${empleadoEncontrado.user.nombre} ${empleadoEncontrado.user.apellido}`;
             cargo = empleadoEncontrado.cargo;
          } else if (licencia.empleado && licencia.empleado.user) {
             nombreCompleto = `${licencia.empleado.user.nombre} ${licencia.empleado.user.apellido}`;
             cargo = licencia.empleado.cargo;
          }

          return {
            ...licencia,
            nombreCompleto,
            cargo
          };
      });

      setPersonalAusenteList(licenciasEnriquecidas);

      // 4. GENERACIÓN DE ALERTAS
      const nuevasAlertas = [];

      // --- ALERTAS SOAP ---
      buses.forEach(bus => {
        if (bus.vencimiento_soap) {
           const venc = new Date(bus.vencimiento_soap);
           venc.setMinutes(venc.getMinutes() + venc.getTimezoneOffset());
           const diffTime = venc - now;
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           const fechaVenc = venc.toLocaleDateString('es-CL');

           if (diffDays < 0) {
              nuevasAlertas.push({ 
                id: bus.id, tipo: 'soap', titulo: 'SOAP VENCIDO', 
                detalle: `Bus ${bus.patente}`, nivel: 'critical', dias: diffDays, vencimiento: fechaVenc 
              });
           } else if (diffDays <= 30) {
              nuevasAlertas.push({ 
                id: bus.id, tipo: 'soap', titulo: 'SOAP por vencer', 
                detalle: `Bus ${bus.patente} (${diffDays} días)`, nivel: 'warning', dias: diffDays, vencimiento: fechaVenc 
              });
           }
        }
      });

      // --- ALERTAS LICENCIAS (CONDUCTORES) ---
      conductores.forEach(cond => {
        if (cond.fecha_vencimiento_licencia) {
           const venc = new Date(cond.fecha_vencimiento_licencia);
           venc.setMinutes(venc.getMinutes() + venc.getTimezoneOffset());
           const diffTime = venc - now;
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           const fechaVenc = venc.toLocaleDateString('es-CL');
           
           const nombre = cond.empleado?.user 
             ? `${cond.empleado.user.nombre} ${cond.empleado.user.apellido}` 
             : `Conductor #${cond.id}`;

           if (diffDays < 0) {
              nuevasAlertas.push({ 
                id: cond.id, tipo: 'licencia', titulo: 'LICENCIA VENCIDA', 
                detalle: nombre, nivel: 'critical', dias: diffDays, vencimiento: fechaVenc 
              });
           } else if (diffDays <= 30) {
              nuevasAlertas.push({ 
                id: cond.id, tipo: 'licencia', titulo: 'Licencia por vencer', 
                detalle: `${nombre} (${diffDays} días)`, nivel: 'warning', dias: diffDays, vencimiento: fechaVenc 
              });
           }
        }
      });

      nuevasAlertas.sort((a, b) => {
        if (a.nivel === 'critical' && b.nivel !== 'critical') return -1;
        if (a.nivel !== 'critical' && b.nivel === 'critical') return 1;
        return a.dias - b.dias;
      });

      setAlertas(nuevasAlertas);

      setStats({
        busesTotal: buses.length,
        busesOperativos: operativos,
        busesMantenimiento: listaMantenimiento.length, 
        rutasActivas: rutas.filter(r => r.estado === 'activa').length,
        viajesHoy: totalViajes,
        viajesCompletadosHoy: completados,
        reportesPendientes,
        personalEnLicencia: licenciasEnriquecidas.length, 
        mantenimientosActivos: mantActivos
      });
      
      setTurnosDelDia(turnosEnriquecidos);

    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
      <p className="text-gray-500 animate-pulse">Cargando tablero de control...</p>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Panel de Operaciones</h1>
          <div className="flex items-center gap-2 mt-2 bg-white px-3 py-1 rounded-full shadow-sm w-fit border border-gray-100">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <span className="text-sm font-medium text-gray-600">
              Datos al {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate('viajes')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all font-medium hover:-translate-y-0.5"
          >
            <TrendingUp size={18} /> 
            <span>Gestionar Viajes</span>
          </button>
          <button 
            onClick={() => onNavigate('buses')}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all font-medium"
          >
            <Bus size={18} /> 
            <span>Flota</span>
          </button>
        </div>
      </div>

      {/* --- ALERTAS DE VENCIMIENTOS --- */}
      {alertas.length > 0 && (
        <div className={`rounded-2xl border transition-all duration-500 overflow-hidden mb-8 ${isAlertasOpen ? 'bg-white border-red-200 shadow-lg ring-1 ring-red-100' : 'bg-red-50 border-red-200 shadow-sm'}`}>
           <button 
             onClick={() => setIsAlertasOpen(!isAlertasOpen)}
             className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-white hover:from-red-100 transition-colors"
           >
              <div className="flex items-center gap-3">
                 <div className="bg-red-100 p-2 rounded-full text-red-600">
                   <Bell className={`size-5 ${alertas.some(a => a.nivel === 'critical') ? 'animate-swing' : ''}`} />
                 </div>
                 <div className="text-left">
                   <p className="text-red-800 font-bold text-sm">ALERTAS DE VENCIMIENTOS</p>
                   <p className="text-red-600 text-xs font-medium">{alertas.length} notificaciones</p>
                 </div>
              </div>
              <div className={`bg-white p-2 rounded-full shadow-sm text-red-500 transition-transform duration-300 ${isAlertasOpen ? 'rotate-180' : ''}`}>
                 <ChevronDown size={20} />
              </div>
           </button>

           {isAlertasOpen && (
             <div className="p-6 border-t border-red-100 bg-white max-h-[500px] overflow-y-auto custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alertas.map((alerta, idx) => {
                     const isCritical = alerta.nivel === 'critical';
                     return (
                       <div 
                         key={idx} 
                         onClick={() => onNavigate(alerta.tipo === 'soap' ? 'buses' : 'conductores')}
                         className={`
                           relative p-4 rounded-xl border-l-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md
                           ${isCritical 
                             ? 'bg-red-50/50 border-red-500 border-t border-r border-b border-gray-100' 
                             : 'bg-amber-50/50 border-amber-500 border-t border-r border-b border-gray-100'
                           }
                         `}
                       >
                          <div className="flex justify-between items-start mb-2">
                             <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${isCritical ? 'text-red-700' : 'text-amber-700'}`}>
                               {isCritical ? <AlertCircle size={14}/> : <AlertTriangle size={14}/>}
                               {alerta.titulo}
                             </div>
                             {isCritical && <span className="flex h-2 w-2 rounded-full bg-red-500"></span>}
                          </div>
                          <p className="font-bold text-gray-800 text-sm mb-1">{alerta.detalle}</p>
                          <div className="flex items-center gap-2 mt-3 text-xs font-medium text-gray-500 bg-white/80 p-1.5 rounded-lg w-fit border border-gray-100">
                             <Calendar size={12} className="text-gray-400" /> 
                             Vence: <span className="text-gray-700">{alerta.vencimiento}</span>
                          </div>
                       </div>
                     );
                  })}
               </div>
             </div>
           )}
        </div>
      )}

      {/* --- KPIS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Estado de Flota */}
        <div 
          onClick={() => onNavigate('buses')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group cursor-pointer hover:shadow-lg hover:border-blue-100 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Flota Operativa</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-extrabold text-gray-900">{stats.busesOperativos}</h3>
                <span className="text-lg text-gray-400 font-medium">/ {stats.busesTotal}</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shadow-sm group-hover:rotate-12 transition-transform">
              <Bus size={28} />
            </div>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if(stats.busesMantenimiento > 0) setShowModalMantenimiento(true);
            }}
            className="mt-6 flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg w-fit border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors z-20 relative"
          >
            <Wrench size={14} /> {stats.busesMantenimiento} en mantenimiento
          </div>
        </div>

        {/* Card 2: Viajes del Día */}
        <div 
           onClick={() => onNavigate('viajes')}
           className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group cursor-pointer hover:shadow-lg hover:border-purple-100 transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100">
             <div 
               className="bg-purple-600 h-full transition-all duration-1000 ease-out" 
               style={{ width: `${stats.viajesHoy > 0 ? (stats.viajesCompletadosHoy / stats.viajesHoy) * 100 : 0}%` }}
             ></div>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Viajes Hoy</p>
              <h3 className="text-4xl font-extrabold text-gray-900">{stats.viajesHoy}</h3>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl shadow-sm group-hover:rotate-12 transition-transform">
              <TrendingUp size={28} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
             <p className="text-sm font-medium text-gray-600">
               <span className="text-purple-600 font-bold">{stats.viajesCompletadosHoy}</span> completados
             </p>
             <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded">
               {stats.viajesHoy > 0 ? Math.round((stats.viajesCompletadosHoy / stats.viajesHoy) * 100) : 0}%
             </span>
          </div>
        </div>

        {/* Card 3: Rutas Activas */}
        <div 
          onClick={() => onNavigate('rutas')}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg hover:border-emerald-100 transition-all duration-300 group"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rutas Activas</p>
              <h3 className="text-4xl font-extrabold text-gray-900">{stats.rutasActivas}</h3>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-sm group-hover:rotate-12 transition-transform">
              <MapPin size={28} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            Ver catálogo de rutas <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* --- TARJETAS RÁPIDAS + PERSONAL --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => onNavigate('reportes')} 
          className="bg-gradient-to-br from-white to-red-50 p-5 rounded-2xl shadow-sm border border-red-100 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
        >
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="bg-white p-3 rounded-xl shadow-sm text-red-500 border border-red-100 group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <FileText size={20} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-bold text-gray-800">{stats.reportesPendientes}</h4>
                    <p className="text-xs text-red-600 font-bold uppercase tracking-wide">Reportes Pendientes</p>
                 </div>
              </div>
              <ChevronUp className="text-red-300 rotate-90" />
           </div>
        </div>

        {/* TARJETA EN TALLER */}
        <div 
          onClick={() => {
            if (stats.busesMantenimiento > 0) {
               setShowModalMantenimiento(true);
            } else {
               onNavigate('mantenciones');
            }
          }} 
          className="bg-gradient-to-br from-white to-orange-50 p-5 rounded-2xl shadow-sm border border-orange-100 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
        >
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="bg-white p-3 rounded-xl shadow-sm text-orange-500 border border-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Wrench size={20} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-bold text-gray-800">{stats.busesMantenimiento}</h4>
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wide">En Taller</p>
                 </div>
              </div>
              <ChevronUp className="text-orange-300 rotate-90" />
           </div>
        </div>

        {/* TARJETA AUSENCIAS ACTIVAS */}
        <div 
          onClick={() => {
            if (stats.personalEnLicencia > 0) {
               setShowModalLicencias(true);
            } else {
               onNavigate('licencias');
            }
          }}
          className="bg-gradient-to-br from-white to-indigo-50 p-5 rounded-2xl shadow-sm border border-indigo-100 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
        >
           <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="bg-white p-3 rounded-xl shadow-sm text-indigo-500 border border-indigo-100 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <Users size={20} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-bold text-gray-800">{stats.personalEnLicencia}</h4>
                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide">Ausencias Activas</p>
                 </div>
              </div>
              <ChevronUp className="text-indigo-300 rotate-90" />
           </div>
        </div>

        <div 
          onClick={() => onNavigate('empleados')}
          className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl shadow-lg text-white cursor-pointer hover:-translate-y-1 transition-transform"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Personal</p>
              <h3 className="text-xl font-bold">Gestionar</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl text-white">
              <Users size={24} />
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-400 flex items-center gap-2">
            Conductores • Mecánicos • Asistentes
          </p>
        </div>
      </div>

      {/* --- MONITOR DE TURNOS --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
               <Clock size={20} />
             </div>
             <div>
               <h3 className="font-bold text-gray-900 text-lg">Monitor de Turnos (Hoy)</h3>
               <p className="text-xs text-gray-500">Estado en tiempo real</p>
             </div>
          </div>
          <button 
            onClick={() => onNavigate('viajes')} 
            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
          >
            VER CALENDARIO COMPLETO
          </button>
        </div>
        
        {turnosDelDia.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
              <Activity className="text-gray-300" size={32} />
            </div>
            <h4 className="text-gray-900 font-medium mb-1">Sin actividad programada</h4>
            <p className="text-gray-500 text-sm">No hay turnos registrados para la fecha actual.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Horario</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Bus</th>
                  <th className="px-6 py-4">Progreso</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {turnosDelDia.slice(0, 5).map((turno) => (
                  <tr key={turno.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-gray-600 font-semibold group-hover:text-blue-600 transition-colors">
                      {turno.hora_inicio.slice(0,5)} - {turno.hora_termino.slice(0,5)}
                    </td>
                    <td className="px-6 py-4 capitalize font-medium text-gray-800">{turno.tipo_turno}</td>
                    
                    <td className="px-6 py-4">
                      {turno.bus?.patente ? (
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-mono text-xs font-bold border border-gray-200">
                          {turno.bus.patente}
                        </span>
                      ) : (
                        <span className="text-red-400 text-xs italic">Sin Asignar</span>
                      )}
                    </td>

                    <td className="px-6 py-4 w-1/3">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${turno.progreso === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${turno.progreso}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-500 min-w-[30px]">{turno.progreso}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => onNavigate('viajes')} 
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                          title="Ver detalle"
                        >
                          <ArrowRight size={18} />
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL FLOTA EN MANTENIMIENTO --- */}
      {showModalMantenimiento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                   <Wrench size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Flota en Mantenimiento</h3>
              </div>
              <button 
                onClick={() => setShowModalMantenimiento(false)} 
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            
            <div className="overflow-y-auto p-0">
               {busesEnTaller.length === 0 ? (
                 <div className="p-10 text-center text-gray-500">
                    <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
                    <p className="font-medium">No hay buses en mantenimiento actualmente.</p>
                 </div>
               ) : (
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 text-gray-600 font-semibold border-b sticky top-0">
                     <tr>
                       <th className="px-6 py-3">Bus (Patente)</th>
                       <th className="px-6 py-3">Marca / Modelo</th>
                       <th className="px-6 py-3">Año</th>
                       <th className="px-6 py-3 text-center">Estado</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {busesEnTaller.map((bus, index) => (
                       <tr key={index} className="hover:bg-orange-50/30 transition-colors">
                         <td className="px-6 py-4 font-bold text-gray-800 font-mono">{bus.patente}</td>
                         <td className="px-6 py-4 text-gray-600">{bus.marca} {bus.modelo}</td>
                         <td className="px-6 py-4 text-gray-600">{bus.anio}</td>
                         <td className="px-6 py-4 text-center">
                           <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold uppercase border border-orange-200">
                             MANTENIMIENTO
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
               <button 
                 onClick={() => setShowModalMantenimiento(false)}
                 className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
               >
                 Cerrar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL AUSENCIAS ACTIVAS (CORREGIDO) --- */}
      {showModalLicencias && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                   <Users size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Personal en Licencia</h3>
              </div>
              <button 
                onClick={() => setShowModalLicencias(false)} 
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            
            <div className="overflow-y-auto p-0">
               {personalAusenteList.length === 0 ? (
                 <div className="p-10 text-center text-gray-500">
                    <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
                    <p className="font-medium">No hay ausencias activas en este momento.</p>
                 </div>
               ) : (
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 text-gray-600 font-semibold border-b sticky top-0">
                     <tr>
                       <th className="px-6 py-3">Funcionario</th>
                       <th className="px-6 py-3">Motivo / Tipo</th>
                       <th className="px-6 py-3">Periodo</th>
                       <th className="px-6 py-3 text-center">Estado</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {personalAusenteList.map((ausencia, index) => {
                       const inicio = new Date(ausencia.fecha_inicio).toLocaleDateString('es-CL');
                       const fin = new Date(ausencia.fecha_termino).toLocaleDateString('es-CL');

                       return (
                         <tr key={index} className="hover:bg-indigo-50/30 transition-colors">
                           <td className="px-6 py-4 font-bold text-gray-800">
                              {ausencia.nombreCompleto}
                              <div className="text-xs text-gray-400 font-normal">{ausencia.cargo}</div>
                           </td>
                           <td className="px-6 py-4 text-gray-600 capitalize">
                              {ausencia.tipo_licencia || ausencia.motivo || 'Licencia Médica'}
                           </td>
                           <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                              {inicio} - {fin}
                           </td>
                           <td className="px-6 py-4 text-center">
                             <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold uppercase border border-indigo-200">
                               {ausencia.estado || 'ACTIVA'}
                             </span>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
               <button 
                 onClick={() => setShowModalLicencias(false)}
                 className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
               >
                 Cerrar
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}