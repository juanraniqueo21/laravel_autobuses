import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Clock, MapPin, CheckCircle, XCircle, Calendar, Bus, Users, Map, Trash2, Hash } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import ViajeDetallePage from './ViajeDetallePage';
import { 
  fetchViajesPorTurno,
  fetchRutas,
  createViaje,
  updateViaje,
  finalizarViaje,
  cancelarViaje,
  deleteViaje
} from '../services/api';

export default function TurnoViajesPage({ turno, onVolver }) {
  // --- CLÁUSULA DE GUARDIA: Si no hay turno, no renderizar nada o mostrar loading ---
  if (!turno) {
    return <div className="p-8 text-center text-gray-500">Cargando información del turno...</div>;
  }

  const [viajes, setViajes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openFinalizarDialog, setOpenFinalizarDialog] = useState(false);
  const [viajeAFinalizar, setViajeAFinalizar] = useState(null);
  const [viajeSeleccionado, setViajeSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    ruta_id: '',
    origen: '',
    destino: '',
    fecha_hora_salida: '',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Validación extra por seguridad
      if (!turno?.id) return;

      const viajesData = await fetchViajesPorTurno(turno.id);
      setViajes(Array.isArray(viajesData) ? viajesData : []);
      
      const rutasData = await fetchRutas();
      const rutasActivas = Array.isArray(rutasData) ? rutasData.filter(r => r.estado === 'activa') : [];
      setRutas(rutasActivas);
      setError(null);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ... resto de los handlers (handleOpenDialog, handleSave, etc.) siguen igual ...
  // COPIA TODO EL RESTO DEL CÓDIGO QUE TE DI ANTERIORMENTE DESDE 'const handleOpenDialog' HACIA ABAJO.
  
  // Solo asegúrate de usar Optional Chaining en el renderizado del Header:
  // {new Date(turno?.fecha_turno).toLocaleDateString('es-CL')}
  
  const handleOpenDialog = () => {
    const ahora = new Date();
    // Ajuste zona horaria local para input datetime-local
    ahora.setMinutes(ahora.getMinutes() - agora.getTimezoneOffset());
    const fechaHoraActual = ahora.toISOString().slice(0, 16);
    
    setFormData({
      ruta_id: '',
      origen: '',
      destino: '',
      fecha_hora_salida: fechaHoraActual,
      observaciones: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleSave = async () => {
    try {
      const viajeData = {
        asignacion_turno_id: turno.id,
        ruta_id: formData.ruta_id,
        fecha_hora_salida: formData.fecha_hora_salida,
        fecha_hora_llegada: null,
        estado: 'programado',
        observaciones: formData.observaciones,
      };
      await createViaje(viajeData);
      loadData();
      handleCloseDialog();
      alert('Viaje programado exitosamente');
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleIniciarViaje = async (viajeId) => {
    try {
      const ahora = new Date().toISOString();
      await updateViaje(viajeId, { estado: 'en_curso', fecha_hora_salida: ahora });
      loadData();
      alert('Viaje iniciado');
    } catch (err) {
      setError('Error al iniciar viaje: ' + err.message);
    }
  };

  const handleOpenFinalizar = (viaje) => {
    setViajeAFinalizar(viaje);
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    const fechaHoraActual = ahora.toISOString().slice(0, 16);
    setFormData({ fecha_hora_llegada: fechaHoraActual, observaciones: viaje.observaciones || '' });
    setOpenFinalizarDialog(true);
  };

  const handleFinalizar = async () => {
    try {
      await finalizarViaje(viajeAFinalizar.id, { fecha_hora_llegada: formData.fecha_hora_llegada, observaciones: formData.observaciones });
      loadData();
      setOpenFinalizarDialog(false);
      setViajeAFinalizar(null);
      alert('Viaje finalizado exitosamente');
    } catch (err) {
      setError('Error al finalizar: ' + err.message);
    }
  };

  const handleCancelar = async (viajeId) => {
    const motivo = prompt('Ingresa el motivo de la cancelación:');
    if (!motivo) return;
    try {
      await cancelarViaje(viajeId, motivo);
      loadData();
      alert('Viaje cancelado');
    } catch (err) {
      setError('Error al cancelar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este viaje?')) {
      try { await deleteViaje(id); loadData(); } catch (err) { setError('Error al eliminar: ' + err.message); }
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'programado': 'bg-blue-100 text-blue-800 border-blue-200',
      'en_curso': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'completado': 'bg-green-100 text-green-800 border-green-200',
      'cancelado': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { id: 'codigo_viaje', label: 'Código', render: (row) => <div className="flex items-center gap-2"><Hash size={14} className="text-gray-400"/><span className="font-mono text-sm font-bold text-slate-700">{row.codigo_viaje}</span></div> },
    { id: 'patente', label: 'Bus', render: (row) => <span className="font-mono font-bold text-gray-900">{turno?.bus?.patente || 'N/A'}</span> },
    { id: 'nombre_viaje', label: 'Ruta', render: (row) => <button onClick={() => setViajeSeleccionado(row.id)} className="flex items-center gap-2 group"><div className="p-1.5 bg-blue-50 text-blue-600 rounded-md group-hover:bg-blue-100 transition-colors"><MapPin size={16} /></div><span className="font-medium text-slate-700 group-hover:text-blue-700 underline decoration-dotted underline-offset-2">{row.nombre_viaje}</span></button> },
    { id: 'fecha_hora_salida', label: 'Salida', render: (row) => <div className="flex flex-col"><span className="font-bold text-slate-700">{new Date(row.fecha_hora_salida).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span><span className="text-xs text-gray-500">{new Date(row.fecha_hora_salida).toLocaleDateString('es-CL')}</span></div> },
    { id: 'fecha_hora_llegada', label: 'Llegada', render: (row) => { if (!row.fecha_hora_llegada) return <span className="text-gray-400 italic">-</span>; return <div className="flex flex-col"><span className="font-bold text-slate-700">{new Date(row.fecha_hora_llegada).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span></div>; } },
    { id: 'estado', label: 'Estado', render: (row) => <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getEstadoColor(row.estado)}`}>{row.estado}</span> },
    { id: 'acciones', label: 'Acciones', render: (row) => (
        <div className="flex justify-center gap-2">
          {row.estado === 'programado' && <button onClick={() => handleIniciarViaje(row.id)} className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors" title="Iniciar"><Clock size={14} /> Iniciar</button>}
          {row.estado === 'en_curso' && <button onClick={() => handleOpenFinalizar(row)} className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors" title="Finalizar"><CheckCircle size={14} /> Fin</button>}
          {row.estado !== 'completado' && row.estado !== 'cancelado' && <button onClick={() => handleCancelar(row.id)} className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 transition-colors" title="Cancelar"><XCircle size={14} /></button>}
          <button onClick={() => handleDelete(row.id)} className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors" title="Eliminar"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  if (viajeSeleccionado) return <ViajeDetallePage viajeId={viajeSeleccionado} onVolver={() => { setViajeSeleccionado(null); loadData(); }} />;
  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <button onClick={onVolver} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"><ArrowLeft size={20} /> Volver a Turnos</button>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div><h1 className="text-3xl font-bold tracking-tight">Gestión de Viajes</h1><p className="mt-2 text-slate-300 max-w-xl">Administra los viajes asociados al turno.</p></div>
          <Button variant="primary" size="lg" onClick={handleOpenDialog} className="flex items-center gap-2 shadow-lg"><Plus size={20} /> Agregar Viaje</Button>
        </div>
        <Map className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6"><strong>Error:</strong> {error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Turno</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Calendar size={20} className="text-blue-600" /></div>
            <div>
                {/* USO DE OPTIONAL CHAINING AQUÍ */}
                <p className="text-xs text-gray-600">Fecha</p>
                <p className="font-semibold text-gray-900">{turno?.fecha_turno ? new Date(turno.fecha_turno).toLocaleDateString('es-CL') : 'Sin fecha'}</p>
                <p className="text-xs text-gray-500 capitalize">{turno?.tipo_turno}</p>
            </div>
          </div>
          {/* ... resto de las cards de info usando optional chaining (turno?.hora_inicio etc) ... */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Clock size={20} className="text-green-600" /></div>
            <div><p className="text-xs text-gray-600">Horario</p><p className="font-semibold text-gray-900">{turno?.hora_inicio} - {turno?.hora_termino}</p></div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Bus size={20} className="text-purple-600" /></div>
            <div><p className="text-xs text-gray-600">Bus</p><p className="font-bold text-gray-900 text-lg">{turno?.bus?.patente || 'N/A'}</p><p className="text-xs text-gray-500">{turno?.bus?.marca} {turno?.bus?.modelo}</p></div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Users size={20} className="text-orange-600" /></div>
            <div><p className="text-xs text-gray-600">Tripulación</p><p className="text-lg font-bold text-gray-900">{turno?.conductores?.length || 0}</p><p className="text-xs text-gray-500">Conductores</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Itinerario de Viajes</h2>
          <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">{viajes.length} Total</span>
        </div>
        <Table columns={columns} data={viajes} loading={false} onDelete={handleDelete} />
      </div>

      {/* Diálogos (copiar del código anterior) */}
      <FormDialog isOpen={openDialog} title="Agregar Viaje" onSubmit={handleSave} onCancel={handleCloseDialog}>
         {/* ... inputs del formulario ... */}
         <div className="space-y-4">
            <Select label="Ruta *" options={rutas.map(r => ({ id: r.id, label: `${r.codigo_ruta} - ${r.nombre_ruta}` }))} value={formData.ruta_id} onChange={(e) => { const r = rutas.find(rut => rut.id === parseInt(e.target.value)); setFormData({ ...formData, ruta_id: e.target.value, origen: r?.origen || '', destino: r?.destino || '' }); }} required />
            {formData.ruta_id && <div className="bg-green-50 p-3 rounded text-sm border border-green-200"><p><strong>Origen:</strong> {formData.origen}</p><p><strong>Destino:</strong> {formData.destino}</p></div>}
            <Input label="Hora Salida *" type="datetime-local" value={formData.fecha_hora_salida} onChange={(e) => setFormData({ ...formData, fecha_hora_salida: e.target.value })} required />
            <textarea className="w-full border rounded p-2" rows={2} placeholder="Observaciones..." value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})} />
         </div>
      </FormDialog>

      <FormDialog isOpen={openFinalizarDialog} title="Finalizar Viaje" onSubmit={handleFinalizar} onCancel={() => setOpenFinalizarDialog(false)}>
         <div className="space-y-4">
            <Input label="Hora Llegada *" type="datetime-local" value={formData.fecha_hora_llegada} onChange={(e) => setFormData({ ...formData, fecha_hora_llegada: e.target.value })} required />
            <textarea className="w-full border rounded p-2" rows={2} placeholder="Observaciones finales..." value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})} />
         </div>
      </FormDialog>
    </div>
  );
}