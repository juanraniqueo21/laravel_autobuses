import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MapPin, Trash2, Edit2, Save, X, Map, Clock } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { fetchRutaById, guardarParadasRuta, updateRuta } from '../services/api';

export default function RutaDetallePage({ rutaId, onClose }) {
  const [ruta, setRuta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingParadas, setEditingParadas] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoData, setInfoData] = useState({});
  const [paradas, setParadas] = useState([]);

  useEffect(() => { loadRuta(); }, [rutaId]);

  const loadRuta = async () => {
    try {
      setLoading(true);
      const data = await fetchRutaById(rutaId);
      setRuta(data);
      setInfoData({
        nombre_ruta: data.nombre_ruta, codigo_ruta: data.codigo_ruta,
        origen: data.origen, destino: data.destino,
        descripcion: data.descripcion || '', estado: data.estado,
      });
      if (data.paradas && data.paradas.length > 0) {
        setParadas(data.paradas);
      } else {
        setParadas([
          { ciudad: data.origen, orden: 1, es_origen: true, es_destino: false, distancia_desde_anterior_km: 0, tiempo_desde_anterior_min: 0, tarifa_adulto: 0, tarifa_estudiante: 0, tarifa_tercera_edad: 0 },
          { ciudad: data.destino, orden: 2, es_origen: false, es_destino: true, distancia_desde_anterior_km: 0, tiempo_desde_anterior_min: 0, tarifa_adulto: 0, tarifa_estudiante: 0, tarifa_tercera_edad: 0 },
        ]);
      }
      setError(null);
    } catch (err) { setError('Error al cargar ruta: ' + err.message); } finally { setLoading(false); }
  };

  const agregarParadaIntermedia = () => {
    const nuevas = [...paradas];
    nuevas.splice(nuevas.length - 1, 0, { ciudad: '', orden: nuevas.length, es_origen: false, es_destino: false, distancia_desde_anterior_km: 0, tiempo_desde_anterior_min: 0, tarifa_adulto: 0, tarifa_estudiante: 0, tarifa_tercera_edad: 0 });
    nuevas.forEach((p, i) => p.orden = i + 1);
    setParadas(nuevas);
  };
  
  const actualizarParada = (i, f, v) => { const n = [...paradas]; n[i][f] = v; setParadas(n); };
  
  const eliminarParada = (index) => {
    if (paradas[index].es_origen || paradas[index].es_destino) return;
    const n = paradas.filter((_, i) => i !== index);
    n.forEach((p, i) => p.orden = i + 1);
    setParadas(n);
  };
  
  const guardarParadas = async () => { try { await guardarParadasRuta(rutaId, { paradas }); setEditingParadas(false); loadRuta(); } catch (e) { alert(e.message); } };
  const guardarInfo = async () => { try { await updateRuta(rutaId, infoData); setEditingInfo(false); loadRuta(); } catch (e) { alert(e.message); } };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen space-y-6">
      <Button variant="secondary" onClick={onClose} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ArrowLeft size={18} /> Volver al listado
      </Button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50/80 p-6 border-b border-gray-100 flex justify-between items-start backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold font-mono border border-blue-200">{ruta.codigo_ruta}</span>
              <h1 className="text-2xl font-bold text-gray-900">{ruta.nombre_ruta}</h1>
            </div>
            <p className="text-gray-500 mt-2 flex items-center gap-2 text-sm"><Map size={16}/> {ruta.origen} <span className="text-gray-300">➜</span> {ruta.destino}</p>
          </div>
          {!editingInfo && (
            <Button variant="secondary" size="sm" onClick={() => setEditingInfo(true)} className="flex gap-2 border-gray-200 bg-white hover:bg-gray-50 shadow-sm"><Edit2 size={16}/> Editar Info</Button>
          )}
        </div>

        <div className="p-6">
          {editingInfo ? (
             <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <Input label="Nombre Ruta" value={infoData.nombre_ruta} onChange={(e)=>setInfoData({...infoData, nombre_ruta:e.target.value})} />
                <Input label="Código" value={infoData.codigo_ruta} onChange={(e)=>setInfoData({...infoData, codigo_ruta:e.target.value})} />
                <div className="col-span-2 flex justify-end gap-2 mt-2">
                   <Button variant="secondary" onClick={()=>setEditingInfo(false)}>Cancelar</Button>
                   <Button variant="primary" onClick={guardarInfo}>Guardar Cambios</Button>
                </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                 <p className="text-xs uppercase text-blue-600 font-bold mb-1 tracking-wider">Distancia</p>
                 <p className="text-3xl font-bold text-slate-800">{ruta.distancia_km || 0} <span className="text-base font-medium text-slate-400">km</span></p>
               </div>
               <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                 <p className="text-xs uppercase text-indigo-600 font-bold mb-1 tracking-wider">Tiempo</p>
                 <p className="text-3xl font-bold text-slate-800">{Math.floor((ruta.tiempo_estimado_minutos||0)/60)}h {(ruta.tiempo_estimado_minutos||0)%60}m</p>
               </div>
               <div className="p-5 text-gray-600 text-sm italic bg-gray-50 rounded-2xl border border-gray-100 flex items-center">
                 "{ruta.descripcion || 'Sin descripción adicional para esta ruta.'}"
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Itinerario</h2>
            <p className="text-sm text-gray-500">Secuencia de paradas y tiempos</p>
          </div>
          {!editingParadas ? (
            <Button variant="primary" size="sm" onClick={() => setEditingParadas(true)} className="flex gap-2 shadow-md shadow-blue-100"><Edit2 size={16}/> Modificar Paradas</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={()=>{setEditingParadas(false); loadRuta();}}>Cancelar</Button>
              <Button variant="primary" size="sm" onClick={guardarParadas} className="flex gap-2"><Save size={16}/> Guardar Cambios</Button>
            </div>
          )}
        </div>

        <div className="relative pl-4 space-y-0 max-w-4xl mx-auto">
          <div className="absolute left-[39px] top-5 bottom-10 w-0.5 bg-slate-200 -z-0"></div>

          {paradas.map((parada, index) => (
            <div key={index} className="relative z-10 pb-10 last:pb-0 group">
              <div className="flex items-start gap-6">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full border-[4px] border-white shadow-md flex items-center justify-center font-bold text-base z-10
                  ${parada.es_origen ? 'bg-emerald-500 text-white' : parada.es_destino ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 border-slate-200'}`}>
                  {parada.es_origen ? 'A' : parada.es_destino ? 'B' : index + 1}
                </div>

                <div className="flex-1 bg-white hover:bg-slate-50 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all rounded-2xl p-5 -mt-2">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        {editingParadas && !parada.es_origen && !parada.es_destino ? (
                          <Input value={parada.ciudad} onChange={(e)=>actualizarParada(index,'ciudad',e.target.value)} placeholder="Nombre Ciudad" className="font-bold"/>
                        ) : (
                          <h3 className="font-bold text-gray-900 text-lg">{parada.ciudad || 'Nueva Parada'}</h3>
                        )}
                        <div className="flex gap-2">
                          {parada.es_origen && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold tracking-wider uppercase">Origen</span>}
                          {parada.es_destino && <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-bold tracking-wider uppercase">Destino</span>}
                          {editingParadas && !parada.es_origen && !parada.es_destino && (
                            <button onClick={() => eliminarParada(index)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={18}/></button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {index > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 border-dashed">
                      <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <Map size={18} className="text-slate-400"/>
                        {editingParadas ? <input type="number" className="w-20 p-1 border rounded text-center font-mono" value={parada.distancia_desde_anterior_km} onChange={(e)=>actualizarParada(index,'distancia_desde_anterior_km',e.target.value)}/> : <span className="font-mono font-medium">{parada.distancia_desde_anterior_km} km</span>} 
                        <span className="text-xs text-slate-400 uppercase font-bold ml-auto">Distancia</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <Clock size={18} className="text-slate-400"/>
                        {editingParadas ? <input type="number" className="w-20 p-1 border rounded text-center font-mono" value={parada.tiempo_desde_anterior_min} onChange={(e)=>actualizarParada(index,'tiempo_desde_anterior_min',e.target.value)}/> : <span className="font-mono font-medium">{parada.tiempo_desde_anterior_min} min</span>}
                        <span className="text-xs text-slate-400 uppercase font-bold ml-auto">Tiempo</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {editingParadas && (
          <div className="flex justify-center mt-8">
            <button onClick={agregarParadaIntermedia} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-6 py-3 rounded-full transition-all shadow-sm hover:shadow-md border border-blue-200">
              <Plus size={18} /> Añadir Parada Intermedia
            </button>
          </div>
        )}
      </div>
    </div>
  );
}