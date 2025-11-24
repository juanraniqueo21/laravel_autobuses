import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Edit2, Trash2, Clock, MapPin, Users, Bus 
} from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import FormDialog from '../components/forms/FormDialog';
import { 
  fetchTurnos, createTurno, updateTurno, deleteTurno,
  fetchBuses, fetchConductores, fetchAsistentes 
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date()); // Seleccionar hoy por defecto
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTurno, setEditingTurno] = useState(null);
  
  const [formData, setFormData] = useState({
    bus_id: '', fecha_turno: '', hora_inicio: '', hora_termino: '',
    tipo_turno: 'mañana', estado: 'programado', observaciones: '',
  });
  
  const [formConductores, setFormConductores] = useState([{ conductor_id: '', rol: 'principal' }]);
  const [formAsistentes, setFormAsistentes] = useState([]);

  // --- EFECTOS ---
  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => { loadTurnos(); }, [currentDate]);
  useEffect(() => { if (success) setTimeout(() => setSuccess(null), 3000); }, [success]);
  useEffect(() => { if (error) setTimeout(() => setError(null), 5000); }, [error]);

  // --- CARGA DE DATOS ---
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [busesData, conductoresData, asistentesData] = await Promise.all([
        fetchBuses(), fetchConductores(), fetchAsistentes()
      ]);
      setBuses(Array.isArray(busesData) ? busesData : []);
      setConductores(Array.isArray(conductoresData) ? conductoresData : []);
      setAsistentes(Array.isArray(asistentesData) ? asistentesData : []);
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
      setFormConductores(turno.conductores?.map(c => ({
        conductor_id: c.id, rol: c.pivot?.rol || 'principal'
      })) || [{ conductor_id: '', rol: 'principal' }]);
      setFormAsistentes(turno.asistentes?.map(a => ({
        asistente_id: a.id, posicion: a.pivot?.posicion || 'general'
      })) || []);
    } else {
      setEditingTurno(null);
      const fechaInicial = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      setFormData({
        bus_id: '', fecha_turno: fechaInicial, hora_inicio: '06:00', hora_termino: '14:00',
        tipo_turno: 'mañana', estado: 'programado', observaciones: '',
      });
      setFormConductores([{ conductor_id: '', rol: 'principal' }]);
      setFormAsistentes([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => { setOpenDialog(false); setEditingTurno(null); };

  const handleSave = async () => {
    try {
      const conductoresValidos = formConductores.filter(c => c.conductor_id);
      if (conductoresValidos.length === 0) { setError('Debe asignar al menos un conductor'); return; }
      
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

  // --- RENDER HELPERS ---
  const getEstadoColor = (estado) => ({
    'programado': 'bg-blue-50 text-blue-700 border-blue-200',
    'en_curso': 'bg-amber-50 text-amber-700 border-amber-200',
    'completado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'cancelado': 'bg-red-50 text-red-700 border-red-200',
  }[estado] || 'bg-gray-50 text-gray-700 border-gray-200');

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const turnosSelected = selectedDate ? getTurnosForDate(selectedDate) : [];

  // Gestión dinámica de conductores/asistentes en formulario
  const handleConductorChange = (idx, field, val) => {
    const newC = [...formConductores]; newC[idx][field] = val; setFormConductores(newC);
  };
  const handleAsistenteChange = (idx, field, val) => {
    const newA = [...formAsistentes]; newA[idx][field] = val; setFormAsistentes(newA);
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

      {/* Feedback Messages */}
      {success && <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex justify-between">{success}<X onClick={()=>setSuccess(null)} className="cursor-pointer" size={18}/></div>}
      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between">{error}<X onClick={()=>setError(null)} className="cursor-pointer" size={18}/></div>}

      {/* === LAYOUT DIVIDIDO: CALENDARIO (IZQ) | AGENDA (DER) === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. CALENDARIO (8 columnas) */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
          {/* Calendar Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-xl font-bold capitalize text-slate-700">{monthName}</h2>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-gray-200 hover:shadow-sm transition-all text-slate-500"><ChevronLeft size={20}/></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-white rounded-full border border-transparent hover:border-gray-200 hover:shadow-sm transition-all">Hoy</button>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-gray-200 hover:shadow-sm transition-all text-slate-500"><ChevronRight size={20}/></button>
            </div>
          </div>

          {/* Grid Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Grid Cells */}
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
                  
                  {/* Indicadores de eventos (Puntos) */}
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

        {/* 2. AGENDA DEL DÍA (4 columnas) */}
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
                        <p className="text-xs text-slate-500">{turno.bus?.modelo}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-white/60 text-xs font-bold uppercase border border-black/5">
                      {turno.tipo_turno}
                    </span>
                  </div>

                  {/* Body Card */}
                  <div className="space-y-2 text-sm text-slate-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400"/>
                      <span className="font-medium">{turno.hora_inicio} - {turno.hora_termino}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users size={14} className="text-slate-400 mt-0.5"/>
                      <div className="flex flex-col">
                        {turno.conductores?.slice(0,2).map((c, idx) => (
                          <span key={idx} className="text-xs">{c.empleado?.user?.nombre} {c.empleado?.user?.apellido}</span>
                        ))}
                        {(turno.conductores?.length > 2) && <span className="text-xs italic">+ {turno.conductores.length - 2} más</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions Overlay (Visible on Hover) */}
                  <div className="flex justify-end gap-2 border-t border-gray-100/50 pt-3 mt-2">
                    <button 
                      onClick={() => handleOpenDialog(turno)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(turno.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                      title="Eliminar"
                    >
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
        <div className="space-y-6">
          {/* Info Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Fecha *" type="date" value={formData.fecha_turno} onChange={(e) => setFormData({...formData, fecha_turno: e.target.value})} required />
            <Select label="Tipo *" options={TIPOS_TURNO.map(t => ({id:t, label:t}))} value={formData.tipo_turno} onChange={(e) => setFormData({...formData, tipo_turno: e.target.value})} required />
            <Input label="Inicio *" type="time" value={formData.hora_inicio} onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})} required />
            <Input label="Término *" type="time" value={formData.hora_termino} onChange={(e) => setFormData({...formData, hora_termino: e.target.value})} required />
          </div>

          {/* Bus */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold text-slate-700 mb-3">Asignación de Bus</h4>
            <Select 
              label="Bus *" 
              options={[{id:'', label:'Seleccione...'}, ...buses.filter(b=>b.estado==='operativo').map(b=>({id:b.id, label:`${b.patente} - ${b.modelo} (${b.tipo_bus})`}))]} 
              value={formData.bus_id} 
              onChange={(e) => setFormData({...formData, bus_id: e.target.value})} 
              required 
            />
          </div>

          {/* Personal */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold text-slate-700 mb-3">Tripulación</h4>
            
            {/* Conductores */}
            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase">Conductores</label>
              {formConductores.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1">
                    <Select 
                      options={[{id:'', label:'Seleccione...'}, ...conductores.filter(x=>x.estado==='activo').map(x=>({id:x.id, label:`${x.empleado?.user?.nombre} ${x.empleado?.user?.apellido}`}))]}
                      value={c.conductor_id}
                      onChange={(e) => handleConductorChange(i, 'conductor_id', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Select options={ROLES_CONDUCTOR.map(r=>({id:r, label:r}))} value={c.rol} onChange={(e)=>handleConductorChange(i,'rol',e.target.value)} />
                  </div>
                  {formConductores.length > 1 && <button type="button" onClick={() => {const n=[...formConductores]; n.splice(i,1); setFormConductores(n)}} className="text-red-500 p-2"><X size={16}/></button>}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setFormConductores([...formConductores, {conductor_id:'', rol:'apoyo'}])} className="w-full border-dashed text-slate-500 hover:text-blue-600 hover:border-blue-300 text-xs py-1">+ Añadir Conductor</Button>
            </div>

            {/* Asistentes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Asistentes</label>
              {formAsistentes.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1">
                    <Select 
                      options={[{id:'', label:'Seleccione...'}, ...asistentes.filter(x=>x.estado==='activo').map(x=>({id:x.id, label:`${x.empleado?.user?.nombre} ${x.empleado?.user?.apellido}`}))]}
                      value={a.asistente_id}
                      onChange={(e) => handleAsistenteChange(i, 'asistente_id', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Select options={POSICIONES_ASISTENTE.map(p=>({id:p, label:p.replace('_',' ')}))} value={a.posicion} onChange={(e)=>handleAsistenteChange(i,'posicion',e.target.value)} />
                  </div>
                  <button type="button" onClick={() => {const n=[...formAsistentes]; n.splice(i,1); setFormAsistentes(n)}} className="text-red-500 p-2"><X size={16}/></button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setFormAsistentes([...formAsistentes, {asistente_id:'', posicion:'general'}])} className="w-full border-dashed text-slate-500 hover:text-blue-600 hover:border-blue-300 text-xs py-1">+ Añadir Asistente</Button>
            </div>
          </div>

          {/* Estado y Notas */}
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