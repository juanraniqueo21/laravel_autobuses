import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Search, ArrowRight, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import RutaDetallePage from './RutaDetallePage'; 
import { fetchRutas, createRuta, updateRuta, deleteRuta } from '../services/api';

const ESTADOS_RUTA = ['activa', 'inactiva', 'en_revision'];

export default function RutasPage() {
  const [allRutas, setAllRutas] = useState([]);
  const [filteredRutas, setFilteredRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRutaId, setSelectedRutaId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [formData, setFormData] = useState({
    nombre_ruta: '', codigo_ruta: '', origen: '', destino: '', descripcion: '', estado: 'activa',
  });

  useEffect(() => { loadRutas(); }, []);

  useEffect(() => {
    const results = allRutas.filter(ruta => 
      ruta.nombre_ruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ruta.codigo_ruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ruta.origen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ruta.destino.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRutas(results);
    setCurrentPage(1);
  }, [searchTerm, allRutas]);

  const loadRutas = async () => {
    try {
      setLoading(true);
      const data = await fetchRutas();
      const sortedData = data.sort((a, b) => b.id - a.id);
      setAllRutas(sortedData);
      setFilteredRutas(sortedData);
      setError(null);
    } catch (err) {
      setError('Error al cargar rutas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedData = filteredRutas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRutas.length / itemsPerPage);

  const handleOpenDialog = () => { setFormData({ nombre_ruta: '', codigo_ruta: '', origen: '', destino: '', descripcion: '', estado: 'activa' }); setOpenDialog(true); };
  const handleCloseDialog = () => setOpenDialog(false);
  const handleSave = async () => { try { await createRuta(formData); loadRutas(); handleCloseDialog(); } catch (e) { setError(e.message); } };
  const handleDelete = async (id) => { if(confirm('¿Eliminar?')) try { await deleteRuta(id); loadRutas(); } catch(e){setError(e.message)} };

  const StatusBadge = ({ status }) => (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${status === 'activa' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );

  const columns = [
    { id: 'codigo_ruta', label: 'Código', render: (row) => <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">{row.codigo_ruta}</span> },
    { id: 'nombre_ruta', label: 'Ruta', render: (row) => <div><div className="font-semibold text-gray-900">{row.nombre_ruta}</div><div className="flex items-center gap-1 text-xs text-gray-500">{row.origen} <ArrowRight size={10}/> {row.destino}</div></div> },
    { 
      id: 'stats', label: 'Métricas',
      render: (row) => (
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1" title="Distancia"><MapPin size={12}/> {row.distancia_km ? `${row.distancia_km}km` : '-'}</span>
          <span className="flex items-center gap-1" title="Tiempo"><Clock size={12}/> {row.tiempo_estimado_minutos ? `${Math.floor(row.tiempo_estimado_minutos / 60)}h ${row.tiempo_estimado_minutos % 60}m` : '-'}</span>
        </div>
      )
    },
    { id: 'paradas', label: 'Paradas', render: (row) => <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">{row.paradas?.length || 0}</span> },
    { id: 'estado', label: 'Estado', render: (row) => <StatusBadge status={row.estado} /> },
  ];

  if (selectedRutaId) return <RutaDetallePage rutaId={selectedRutaId} onClose={() => { setSelectedRutaId(null); loadRutas(); }} />;

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen space-y-6">
      {/* HEADER CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catálogo de Rutas</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Administración de trazados y paradas.</p>
          </div>
          <Button variant="primary" onClick={handleOpenDialog} className="flex gap-2 shadow-lg">
            <Plus size={20} /> Nueva Ruta
          </Button>
        </div>
        <MapPin className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar ruta por nombre, código o ciudad..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table columns={columns} data={paginatedData} loading={loading} onEdit={(r) => setSelectedRutaId(r.id)} onDelete={handleDelete} />
        
        {/* Controles Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"><ChevronLeft size={20}/></button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"><ChevronRight size={20}/></button>
            </div>
          </div>
        )}
      </div>

      <FormDialog isOpen={openDialog} title="Nueva Ruta" onSubmit={handleSave} onCancel={handleCloseDialog}>
         <div className="space-y-4">
            <Input label="Código" value={formData.codigo_ruta} onChange={(e)=>setFormData({...formData, codigo_ruta:e.target.value})} required/>
            <Input label="Nombre" value={formData.nombre_ruta} onChange={(e)=>setFormData({...formData, nombre_ruta:e.target.value})} required/>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Origen" value={formData.origen} onChange={(e)=>setFormData({...formData, origen:e.target.value})} required/>
                <Input label="Destino" value={formData.destino} onChange={(e)=>setFormData({...formData, destino:e.target.value})} required/>
            </div>
            <Select label="Estado" options={ESTADOS_RUTA.map(e=>({id:e, label:e}))} value={formData.estado} onChange={(e)=>setFormData({...formData, estado:e.target.value})} required/>
         </div>
      </FormDialog>
    </div>
  );
}