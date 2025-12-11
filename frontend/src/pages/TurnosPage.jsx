import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Edit2, Trash2, Clock, Users, Bus, AlertCircle, UserCheck, Search, User, Layers 
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import FormDialog from '../components/forms/FormDialog';
import { 
  fetchTurnos, createTurno, updateTurno, deleteTurno,
  fetchBuses, fetchConductores, fetchAsistentes, fetchLicencias 
} from '../services/api';

const TIPOS_TURNO = ['mañana', 'tarde', 'noche', 'completo'];
const ESTADOS_TURNO = ['programado', 'en_curso', 'completado', 'cancelado'];
const ROLES_CONDUCTOR = ['principal', 'apoyo'];
const POSICIONES_ASISTENTE = ['piso_superior', 'piso_inferior', 'general'];

export default function TurnosPage() {
  // --- ESTADOS ---
  const [turnos, setTurnos] = useState([]);
  const [buses, setBuses] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [asistentes, setAsistentes] = useState([]);
  const [licencias, setLicencias] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTurno, setEditingTurno] = useState(null);
  
  const [formData, setFormData] = useState({
    bus_id: '', fecha_turno: '', hora_inicio: '', hora_termino: '',
    tipo_turno: 'mañana', estado: 'programado', observaciones: '',
  });
  
  const [formConductores, setFormConductores] = useState([{ conductor_id: '', rol: 'principal' }]);
  const [formAsistentes, setFormAsistentes] = useState([]);

  // --- ESTADOS PARA BÚSQUEDA ---
  const [busSearch, setBusSearch] = useState('');
  const [showBusOptions, setShowBusOptions] = useState(false);

  // Arrays para manejar el texto de búsqueda de cada fila dinámica
  const [condSearchTerms, setCondSearchTerms] = useState(['']); 
  const [showCondOptions, setShowCondOptions] = useState([false]);

  const [asistSearchTerms, setAsistSearchTerms] = useState([]);
  const [showAsistOptions, setShowAsistOptions] = useState([]);

  // Ref para detectar clics fuera y cerrar sugerencias
  const wrapperRef = useRef(null);

  // --- EFECTOS ---
  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => { loadTurnos(); }, [currentDate]);
  useEffect(() => { if (success) setTimeout(() => setSuccess(null), 3000); }, [success]);
  useEffect(() => { if (error) setTimeout(() => setError(null), 5000); }, [error]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowBusOptions(false);
        setShowCondOptions(prev => prev.map(() => false));
        setShowAsistOptions(prev => prev.map(() => false));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- CARGA DE DATOS ---
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [busesData, conductoresData, asistentesData] = await Promise.all([
        fetchBuses(), 
        fetchConductores(), 
        fetchAsistentes()
      ]);
      
      setBuses(Array.isArray(busesData) ? busesData : []);
      setConductores(Array.isArray(conductoresData) ? conductoresData : []);
      setAsistentes(Array.isArray(asistentesData) ? asistentesData : []);
      
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && [1, 2, 6].includes(user.rol_id)) {
        try {
          const licenciasData = await fetchLicencias();
          setLicencias(Array.isArray(licenciasData) ? licenciasData.filter(l => l.estado === 'aprobado') : []);
        } catch (err) {
          setLicencias([]);
        }
      } else {
        setLicencias([]);
      }
      
      await loadTurnos();
    } catch (err) {
      setError('Error al cargar datos iniciales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTurnos = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const filters = {
        fecha_inicio: `${year}-${String(month).padStart(2, '0')}-01`,
        fecha_fin: new Date(year, month, 0).toISOString().split('T')[0]
      };
      const data = await fetchTurnos(filters);
      setTurnos(Array.isArray(data) ? data : []);
    } catch (err) {
      setTurnos([]);
    }
  };

  // --- VALIDACIÓN DE LICENCIAS ---
  const empleadoTieneLicenciaEnFecha = (empleadoId, fechaTurno) => {
    if (!empleadoId || !fechaTurno) return null;
    
    return licencias.find(licencia => {
      if (licencia.empleado_id !== empleadoId) return false;
      if (licencia.estado !== 'aprobado') return false;
      
      const fechaInicio = new Date(licencia.fecha_inicio);
      const fechaTermino = new Date(licencia.fecha_termino);
      const fechaCheck = new Date(fechaTurno);
      
      return fechaCheck >= fechaInicio && fechaCheck <= fechaTermino;
    });
  };

  // --- LOGICA DE DISPONIBILIDAD ---
  const getConductoresDisponibles = () => {
    const conductoresAsignadosEnEsteTurno = editingTurno ? editingTurno.conductores?.map(c => c.id) || [] : [];
    const conductoresSeleccionados = formConductores.map(c => parseInt(c.conductor_id)).filter(id => !isNaN(id));

    return conductores.filter(c => c.estado === 'activo').map(conductor => {
      const licencia = empleadoTieneLicenciaEnFecha(conductor.empleado_id, formData.fecha_turno);
      let yaTieneTurnoEseDia = false;
      if (formData.fecha_turno) {
        const fechaTurno = formData.fecha_turno;
        yaTieneTurnoEseDia = turnos.some(turno => {
          if (editingTurno && turno.id === editingTurno.id) return false;
          const turnoFecha = turno.fecha_turno.split('T')[0];
          if (turnoFecha !== fechaTurno) return false;
          return turno.conductores?.some(c => c.id === conductor.id);
        });
      }
      const yaSeleccionadoEnOtroCampo = conductoresSeleccionados.includes(conductor.id) && !conductoresAsignadosEnEsteTurno.includes(conductor.id);
      return { ...conductor, tieneLicencia: !!licencia, licenciaInfo: licencia, yaTieneTurno: yaTieneTurnoEseDia, yaSeleccionado: yaSeleccionadoEnOtroCampo };
    }).filter(conductor => {
      if (editingTurno && conductoresAsignadosEnEsteTurno.includes(conductor.id)) return true;
      return !conductor.tieneLicencia && !conductor.yaTieneTurno;
    });
  };

  const getAsistentesDisponibles = () => {
    const asistentesAsignadosEnEsteTurno = editingTurno ? editingTurno.asistentes?.map(a => a.id) || [] : [];
    const asistentesSeleccionados = formAsistentes.map(a => parseInt(a.asistente_id)).filter(id => !isNaN(id));

    return asistentes.filter(a => a.estado === 'activo').map(asistente => {
      const licencia = empleadoTieneLicenciaEnFecha(asistente.empleado_id, formData.fecha_turno);
      let yaTieneTurnoEseDia = false;
      if (formData.fecha_turno) {
        const fechaTurno = formData.fecha_turno;
        yaTieneTurnoEseDia = turnos.some(turno => {
          if (editingTurno && turno.id === editingTurno.id) return false;
          const turnoFecha = turno.fecha_turno.split('T')[0];
          if (turnoFecha !== fechaTurno) return false;
          return turno.asistentes?.some(a => a.id === asistente.id);
        });
      }
      const yaSeleccionadoEnOtroCampo = asistentesSeleccionados.includes(asistente.id) && !asistentesAsignadosEnEsteTurno.includes(asistente.id);
      return { ...asistente, tieneLicencia: !!licencia, licenciaInfo: licencia, yaTieneTurno: yaTieneTurnoEseDia, yaSeleccionado: yaSeleccionadoEnOtroCampo };
    }).filter(asistente => {
      if (editingTurno && asistentesAsignadosEnEsteTurno.includes(asistente.id)) return true;
      return !asistente.tieneLicencia && !asistente.yaTieneTurno;
    });
  };

  // --- LOGICA CALENDARIO ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
  };

  const getTurnosForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return turnos.filter(t => t.fecha_turno.split('T')[0] === dateStr);
  };

  const changeMonth = (increment) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
  };

  // --- HANDLERS ---
  const handleOpenDialog = (turno = null, date = null) => {
    if (turno) {
      setEditingTurno(turno);
      setFormData({
        bus_id: turno.bus?.id || turno.bus_id,
        fecha_turno: turno.fecha_turno.split('T')[0],
        hora_inicio: turno.hora_inicio,
        hora_termino: turno.hora_termino,
        tipo_turno: turno.tipo_turno,
        estado: turno.estado,
        observaciones: turno.observaciones || '',
      });

      // Precargar Buscador de Bus
      const bus = buses.find(b => b.id === (turno.bus?.id || turno.bus_id));
      setBusSearch(bus ? `${bus.patente} - ${bus.modelo}` : '');

      // Precargar Conductores
      const mappedConductores = turno.conductores?.map(c => ({
        conductor_id: c.id, rol: c.pivot?.rol || 'principal'
      })) || [{ conductor_id: '', rol: 'principal' }];
      setFormConductores(mappedConductores);
      
      setCondSearchTerms(turno.conductores?.map(c => 
        c.empleado?.user ? `${c.empleado.user.nombre} ${c.empleado.user.apellido}` : ''
      ) || ['']);
      setShowCondOptions(new Array(mappedConductores.length).fill(false));

      // Precargar Asistentes
      const mappedAsistentes = turno.asistentes?.map(a => ({
        asistente_id: a.id, posicion: a.pivot?.posicion || 'general'
      })) || [];
      setFormAsistentes(mappedAsistentes);

      setAsistSearchTerms(turno.asistentes?.map(a => 
        a.empleado?.user ? `${a.empleado.user.nombre} ${a.empleado.user.apellido}` : ''
      ) || []);
      setShowAsistOptions(new Array(mappedAsistentes.length).fill(false));

    } else {
      setEditingTurno(null);
      const fechaInicial = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setFormData({
        bus_id: '', fecha_turno: fechaInicial, hora_inicio: '06:00', hora_termino: '14:00',
        tipo_turno: 'mañana', estado: 'programado', observaciones: '',
      });
      setBusSearch('');
      setFormConductores([{ conductor_id: '', rol: 'principal' }]);
      setCondSearchTerms(['']);
      setShowCondOptions([false]);
      setFormAsistentes([]);
      setAsistSearchTerms([]);
      setShowAsistOptions([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => { setOpenDialog(false); setEditingTurno(null); };

  const handleSave = async () => {
    try {
      const conductoresValidos = formConductores.filter(c => c.conductor_id);
      if (conductoresValidos.length === 0) { 
        setError('Debe asignar al menos un conductor'); 
        return; 
      }

      // Validar licencias
      for (const c of conductoresValidos) {
        const conductor = conductores.find(x => x.id === parseInt(c.conductor_id));
        if (conductor) {
          const licencia = empleadoTieneLicenciaEnFecha(conductor.empleado_id, formData.fecha_turno);
          if (licencia) {
            setError(`El conductor ${conductor.empleado?.user?.nombre} tiene licencia médica`);
            return;
          }
        }
      }

      for (const a of formAsistentes.filter(x => x.asistente_id)) {
        const asistente = asistentes.find(x => x.id === parseInt(a.asistente_id));
        if (asistente) {
          const licencia = empleadoTieneLicenciaEnFecha(asistente.empleado_id, formData.fecha_turno);
          if (licencia) {
            setError(`El asistente ${asistente.empleado?.user?.nombre} tiene licencia médica`);
            return;
          }
        }
      }
      
      const payload = {
        ...formData,
        conductores: conductoresValidos,
        asistentes: formAsistentes.filter(a => a.asistente_id),
      };

      if (editingTurno) {
        await updateTurno(editingTurno.id, payload);
        setSuccess('Turno actualizado');
      } else {
        await createTurno(payload);
        setSuccess('Turno creado');
      }
      loadTurnos();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar turno?')) {
      try {
        await deleteTurno(id);
        setSuccess('Turno eliminado');
        loadTurnos();
      } catch (err) {
        setError('Error al eliminar');
      }
    }
  };

  // --- LOGICA DE FILTROS EN FORMULARIO ---
  const getFilteredBuses = () => {
    if (!busSearch) return buses.filter(b => b.estado === 'operativo');
    const term = busSearch.toLowerCase();
    return buses.filter(b => 
      b.estado === 'operativo' && 
      (b.patente.toLowerCase().includes(term) || b.modelo.toLowerCase().includes(term))
    );
  };

  // --- HELPERS RENDER ---
  const getEstadoColor = (estado) => ({
    'programado': 'bg-blue-50 text-blue-700 border-blue-200',
    'en_curso': 'bg-amber-50 text-amber-700 border-amber-200',
    'completado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'cancelado': 'bg-red-50 text-red-700 border-red-200',
  }[estado] || 'bg-gray-50 text-gray-700 border-gray-200');

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const turnosSelected = selectedDate ? getTurnosForDate(selectedDate) : [];

  const conductoresDisponibles = getConductoresDisponibles();
  const asistentesDisponibles = getAsistentesDisponibles();

  // Gestión dinámica Conductores
  const updateConductorSearch = (idx, value) => {
    const newTerms = [...condSearchTerms]; newTerms[idx] = value; setCondSearchTerms(newTerms);
    const newOpts = [...showCondOptions]; newOpts[idx] = true; setShowCondOptions(newOpts);
    if (!value) {
      const newC = [...formConductores]; newC[idx].conductor_id = ''; setFormConductores(newC);
    }
  };

  const selectConductor = (idx, conductor) => {
    const newC = [...formConductores]; newC[idx].conductor_id = conductor.id; setFormConductores(newC);
    const newTerms = [...condSearchTerms]; newTerms[idx] = `${conductor.empleado.user.nombre} ${conductor.empleado.user.apellido}`; setCondSearchTerms(newTerms);
    const newOpts = [...showCondOptions]; newOpts[idx] = false; setShowCondOptions(newOpts);
  };

  // Gestión dinámica Asistentes
  const updateAsistenteSearch = (idx, value) => {
    const newTerms = [...asistSearchTerms]; newTerms[idx] = value; setAsistSearchTerms(newTerms);
    const newOpts = [...showAsistOptions]; newOpts[idx] = true; setShowAsistOptions(newOpts);
    if (!value) {
      const newA = [...formAsistentes]; newA[idx].asistente_id = ''; setFormAsistentes(newA);
    }
  };

  const selectAsistente = (idx, asistente) => {
    const newA = [...formAsistentes]; newA[idx].asistente_id = asistente.id; setFormAsistentes(newA);
    const newTerms = [...asistSearchTerms]; newTerms[idx] = `${asistente.empleado.user.nombre} ${asistente.empleado.user.apellido}`; setAsistSearchTerms(newTerms);
    const newOpts = [...showAsistOptions]; newOpts[idx] = false; setShowAsistOptions(newOpts);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans text-slate-800">
      
      {/* === HEADER CARD === */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Turnos</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Planificación mensual de flota y personal.</p>
          </div>
          <Button
            variant="primary"
            onClick={() => handleOpenDialog(null, selectedDate)}
            className="flex items-center gap-2 shadow-lg bg-blue-600 hover:bg-blue-500 text-white border-none"
          >
            <Plus size={20} /> Nuevo Turno
          </Button>
        </div>
        <CalendarIcon className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Messages */}
      {success && <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex justify-between">{success}<X onClick={()=>setSuccess(null)} className="cursor-pointer" size={18}/></div>}
      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between">{error}<X onClick={()=>setError(null)} className="cursor-pointer" size={18}/></div>}

      {/* === LAYOUT DIVIDIDO === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. CALENDARIO */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-xl font-bold capitalize text-slate-700">{monthName}</h2>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-gray-200 hover:shadow-sm transition-all text-slate-500"><ChevronLeft size={20}/></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-white rounded-full border border-transparent hover:border-gray-200 hover:shadow-sm transition-all">Hoy</button>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-gray-200 hover:shadow-sm transition-all text-slate-500"><ChevronRight size={20}/></button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1 bg-gray-100 gap-px border-gray-200">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} className="bg-gray-50" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const count = getTurnosForDate(date).length;

              return (
                <div 
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`bg-white relative cursor-pointer hover:bg-blue-50/50 transition-colors p-2 flex flex-col items-center justify-start group
                    ${isSelected ? 'bg-blue-50 ring-inset ring-2 ring-blue-500 z-10' : ''}
                  `}
                >
                  <span className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1
                    ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 group-hover:bg-gray-200'}
                  `}>
                    {i + 1}
                  </span>
                  
                  <div className="flex flex-wrap justify-center gap-1 content-start w-full px-1">
                    {Array.from({ length: Math.min(count, 4) }).map((_, idx) => (
                      <div key={idx} className={`h-1.5 w-1.5 rounded-full ${idx === 3 ? 'bg-gray-300' : 'bg-blue-400'}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. AGENDA DEL DÍA */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon size={18} className="text-blue-600"/>
              Agenda del Día
            </h3>
            <p className="text-sm text-slate-500 mt-1 capitalize">
              {selectedDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {turnosSelected.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <CalendarIcon size={48} className="mb-4 opacity-20"/>
                <p className="text-sm font-medium">Sin turnos programados</p>
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(null, selectedDate)} className="mt-4">
                  Crear Turno
                </Button>
              </div>
            ) : (
              turnosSelected.map((turno) => (
                <div key={turno.id} className={`group relative bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${getEstadoColor(turno.estado)}`}>
                  
                  {/* Header Card */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
                        <Bus size={18} className="text-slate-700" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{turno.bus?.patente || 'S/P'}</p>
                        
                        {/* --- AQUÍ ESTÁ EL NUEVO INDICADOR VISUAL DE TIPO DE BUS --- */}
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-500">{turno.bus?.modelo}</p>
                          {turno.bus?.tipo_bus && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                              turno.bus.tipo_bus === 'doble_piso' 
                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {turno.bus.tipo_bus === 'doble_piso' ? 'Doble Piso' : 'Normal'}
                            </span>
                          )}
                        </div>
                        {/* --------------------------------------------------------- */}

                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-white/60 text-xs font-bold uppercase border border-black/5">
                      {turno.tipo_turno}
                    </span>
                  </div>

                  {/* Body Card */}
                  <div className="space-y-3 text-sm text-slate-600 mb-3">
                    <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded">
                      <Clock size={14} className="text-slate-500"/>
                      <span className="font-medium text-xs">{turno.hora_inicio} - {turno.hora_termino}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="min-w-[16px]"><Users size={14} className="text-blue-500 mt-0.5"/></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Conductores</span>
                        {turno.conductores?.slice(0,2).map((c, idx) => (
                          <span key={idx} className="text-xs font-medium text-slate-700">
                            {c.empleado?.user?.nombre} {c.empleado?.user?.apellido}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Asistentes */}
                    {turno.asistentes && turno.asistentes.length > 0 && (
                      <div className="flex items-start gap-2 pt-2 border-t border-black/5">
                        <div className="min-w-[16px]"><UserCheck size={14} className="text-emerald-500 mt-0.5"/></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Asistentes</span>
                          {turno.asistentes.slice(0, 2).map((a, idx) => (
                            <span key={idx} className="text-xs font-medium text-slate-700">
                              {a.empleado?.user?.nombre} {a.empleado?.user?.apellido}
                            </span>
                          ))}
                          {turno.asistentes.length > 2 && (
                            <span className="text-[10px] italic text-slate-400">
                              + {turno.asistentes.length - 2} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 border-t border-gray-100/50 pt-3 mt-2">
                    <button onClick={() => handleOpenDialog(turno)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(turno.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* === MODAL FORMULARIO === */}
      <FormDialog
        isOpen={openDialog}
        title={editingTurno ? 'Editar Turno' : 'Nuevo Turno'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
        size="large"
      >
        <div className="space-y-6" ref={wrapperRef}>
          {/* Info Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Fecha *" type="date" value={formData.fecha_turno} onChange={(e) => setFormData({...formData, fecha_turno: e.target.value})} required />
            <Select label="Tipo *" options={TIPOS_TURNO.map(t => ({id:t, label:t}))} value={formData.tipo_turno} onChange={(e) => setFormData({...formData, tipo_turno: e.target.value})} required />
            <Input label="Inicio *" type="time" value={formData.hora_inicio} onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})} required />
            <Input label="Término *" type="time" value={formData.hora_termino} onChange={(e) => setFormData({...formData, hora_termino: e.target.value})} required />
          </div>

          {/* BUSCADOR DE BUS (AUTOCOMPLETADO) */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bus *</label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-9"
                placeholder="Buscar por patente o modelo..."
                value={busSearch}
                onChange={(e) => { setBusSearch(e.target.value); setShowBusOptions(true); }}
                onFocus={() => setShowBusOptions(true)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              {busSearch && (
                <button type="button" onClick={() => { setBusSearch(''); setFormData({...formData, bus_id: ''}); }} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>
            
            {showBusOptions && (
              <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                {getFilteredBuses().length > 0 ? (
                  getFilteredBuses().map(bus => (
                    <li 
                      key={bus.id}
                      onClick={() => {
                        setFormData({...formData, bus_id: bus.id});
                        setBusSearch(`${bus.patente} - ${bus.modelo}`);
                        setShowBusOptions(false);
                      }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 flex items-center gap-3"
                    >
                      <div className="bg-blue-100 p-1.5 rounded-full text-blue-600"><Bus size={16} /></div>
                      <div>
                        <div className="font-medium text-gray-800">{bus.patente}</div>
                        {/* --- MUESTRA EL TIPO TAMBIÉN EN EL BUSCADOR --- */}
                        <div className="text-xs text-gray-500">
                          {bus.modelo} <span className="text-slate-400">• {bus.tipo_bus?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-sm text-gray-400 text-center">No se encontraron buses operativos</li>
                )}
              </ul>
            )}
          </div>

          {/* Personal */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold text-slate-700 mb-3">Tripulación</h4>
              
            {/* CONDUCTORES (Buscador por fila) */}
            <div className="space-y-3 mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase">Conductores</label>
              {formConductores.map((c, i) => {
                const conductor = conductores.find(x => x.id === parseInt(c.conductor_id));
                const tieneLicencia = conductor && empleadoTieneLicenciaEnFecha(conductor.empleado_id, formData.fecha_turno);
                
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex gap-2 relative">
                      {/* Input Buscador Conductor */}
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-9 text-sm"
                          placeholder="Buscar conductor..."
                          value={condSearchTerms[i]}
                          onChange={(e) => updateConductorSearch(i, e.target.value)}
                          onFocus={() => {
                            const newOpts = [...showCondOptions]; newOpts[i] = true; setShowCondOptions(newOpts);
                          }}
                        />
                        <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        
                        {/* Sugerencias Conductor */}
                        {showCondOptions[i] && (
                          <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1 left-0">
                            {conductoresDisponibles
                              .filter(con => {
                                const term = condSearchTerms[i].toLowerCase();
                                const nombre = `${con.empleado?.user?.nombre} ${con.empleado?.user?.apellido}`.toLowerCase();
                                return nombre.includes(term) || (con.empleado?.user?.rut && con.empleado.user.rut.includes(term));
                              })
                              .map(con => (
                                <li 
                                  key={con.id} 
                                  onClick={() => selectConductor(i, con)}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50"
                                >
                                  {con.empleado?.user?.nombre} {con.empleado?.user?.apellido}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>

                      <div className="w-32">
                        <Select options={ROLES_CONDUCTOR.map(r=>({id:r, label:r}))} value={c.rol} onChange={(e)=>{
                           const newC = [...formConductores]; newC[i].rol = e.target.value; setFormConductores(newC);
                        }} />
                      </div>
                      
                      {formConductores.length > 1 && (
                        <button type="button" onClick={() => {
                          const newC = [...formConductores]; newC.splice(i,1); setFormConductores(newC);
                          const newT = [...condSearchTerms]; newT.splice(i,1); setCondSearchTerms(newT);
                          const newO = [...showCondOptions]; newO.splice(i,1); setShowCondOptions(newO);
                        }} className="text-red-500 p-2 hover:bg-red-50 rounded">
                          <X size={16}/>
                        </button>
                      )}
                    </div>
                    
                    {tieneLicencia && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        <AlertCircle size={14}/> Conductor con licencia médica en esta fecha
                      </div>
                    )}
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={() => {
                setFormConductores([...formConductores, {conductor_id:'', rol:'apoyo'}]);
                setCondSearchTerms([...condSearchTerms, '']);
                setShowCondOptions([...showCondOptions, false]);
              }} className="w-full border-dashed text-slate-500 text-xs py-1">+ Añadir Conductor</Button>
            </div>

            {/* ASISTENTES (Buscador por fila) */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase">Asistentes</label>
              {formAsistentes.map((a, i) => {
                const asistente = asistentes.find(x => x.id === parseInt(a.asistente_id));
                const tieneLicencia = asistente && empleadoTieneLicenciaEnFecha(asistente.empleado_id, formData.fecha_turno);

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex gap-2 relative">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-9 text-sm"
                          placeholder="Buscar asistente..."
                          value={asistSearchTerms[i]}
                          onChange={(e) => updateAsistenteSearch(i, e.target.value)}
                          onFocus={() => {
                            const newOpts = [...showAsistOptions]; newOpts[i] = true; setShowAsistOptions(newOpts);
                          }}
                        />
                        <UserCheck className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        
                        {showAsistOptions[i] && (
                          <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1 left-0">
                            {asistentesDisponibles
                              .filter(asist => {
                                const term = asistSearchTerms[i].toLowerCase();
                                const nombre = `${asist.empleado?.user?.nombre} ${asist.empleado?.user?.apellido}`.toLowerCase();
                                return nombre.includes(term);
                              })
                              .map(asist => (
                                <li 
                                  key={asist.id} 
                                  onClick={() => selectAsistente(i, asist)}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50"
                                >
                                  {asist.empleado?.user?.nombre} {asist.empleado?.user?.apellido}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>

                      <div className="w-32">
                        <Select options={POSICIONES_ASISTENTE.map(p=>({id:p, label:p.replace('_',' ')}))} value={a.posicion} onChange={(e)=>{
                          const newA = [...formAsistentes]; newA[i].posicion = e.target.value; setFormAsistentes(newA);
                        }} />
                      </div>

                      <button type="button" onClick={() => {
                        const newA = [...formAsistentes]; newA.splice(i,1); setFormAsistentes(newA);
                        const newT = [...asistSearchTerms]; newT.splice(i,1); setAsistSearchTerms(newT);
                        const newO = [...showAsistOptions]; newO.splice(i,1); setShowAsistOptions(newO);
                      }} className="text-red-500 p-2 hover:bg-red-50 rounded">
                        <X size={16}/>
                      </button>
                    </div>
                    {tieneLicencia && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                        <AlertCircle size={14}/> Asistente con licencia médica
                      </div>
                    )}
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={() => {
                setFormAsistentes([...formAsistentes, {asistente_id:'', posicion:'general'}]);
                setAsistSearchTerms([...asistSearchTerms, '']);
                setShowAsistOptions([...showAsistOptions, false]);
              }} className="w-full border-dashed text-slate-500 text-xs py-1">+ Añadir Asistente</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t pt-4">
            <Select label="Estado" options={ESTADOS_TURNO.map(e => ({id:e, label:e}))} value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
            </div>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}