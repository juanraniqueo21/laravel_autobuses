import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MapPin, Trash2, Edit2, Save, X } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { 
  fetchRutaById, 
  guardarParadasRuta, 
  updateRuta,
} from '../services/api';

export default function RutaDetallePage({ rutaId, onClose }) {
  const [ruta, setRuta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingParadas, setEditingParadas] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoData, setInfoData] = useState({
    nombre_ruta: '',
    codigo_ruta: '',
    origen: '',
    destino: '',
    descripcion: '',
    estado: '',
  });

  const [paradas, setParadas] = useState([]);

  useEffect(() => {
    loadRuta();
  }, [rutaId]);

  const loadRuta = async () => {
    try {
      setLoading(true);
      const data = await fetchRutaById(rutaId);
      setRuta(data);

      // cargar datos para edicion
      setInfoData({
        nombre_ruta: data.nombre_ruta,
        codigo_ruta: data.codigo_ruta,
        origen: data.origen,
        destino: data.destino,
        descripcion: data.descripcion || '',
        estado: data.estado,
      });
      
      if (data.paradas && data.paradas.length > 0) {
        setParadas(data.paradas);
      } else {
        setParadas([
          {
            ciudad: data.origen,
            orden: 1,
            es_origen: true,
            es_destino: false,
            distancia_desde_anterior_km: 0,
            tiempo_desde_anterior_min: 0,
            tarifa_adulto: 0,
            tarifa_estudiante: 0,
            tarifa_tercera_edad: 0,
          },
          {
            ciudad: data.destino,
            orden: 2,
            es_origen: false,
            es_destino: true,
            distancia_desde_anterior_km: 0,
            tiempo_desde_anterior_min: 0,
            tarifa_adulto: 0,
            tarifa_estudiante: 0,
            tarifa_tercera_edad: 0,
          },
        ]);
      }

      setError(null);
    } catch (err) {
      setError('Error al cargar ruta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const agregarParadaIntermedia = () => {
    const nuevasParadas = [...paradas];
    
    nuevasParadas.splice(nuevasParadas.length - 1, 0, {
      ciudad: '',
      orden: nuevasParadas.length,
      es_origen: false,
      es_destino: false,
      distancia_desde_anterior_km: 0,
      tiempo_desde_anterior_min: 0,
      tarifa_adulto: 0,
      tarifa_estudiante: 0,
      tarifa_tercera_edad: 0,
    });

    nuevasParadas.forEach((p, index) => {
      p.orden = index + 1;
    });

    setParadas(nuevasParadas);
  };

  const actualizarParada = (index, field, value) => {
    const nuevasParadas = [...paradas];
    nuevasParadas[index][field] = value;
    setParadas(nuevasParadas);
  };

  const eliminarParada = (index) => {
    if (paradas[index].es_origen || paradas[index].es_destino) {
      alert('No se puede eliminar el origen o destino');
      return;
    }

    const nuevasParadas = paradas.filter((_, i) => i !== index);
    
    nuevasParadas.forEach((p, i) => {
      p.orden = i + 1;
    });

    setParadas(nuevasParadas);
  };

  const guardarParadas = async () => {
    try {
      const paradaVacia = paradas.find((p, i) => 
        i > 0 && i < paradas.length - 1 && !p.ciudad.trim()
      );

      if (paradaVacia) {
        alert('Todas las paradas intermedias deben tener nombre de ciudad');
        return;
      }

      await guardarParadasRuta(rutaId, { paradas });
      setEditingParadas(false);
      loadRuta();
      alert('Paradas y tarifas guardadas exitosamente');
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const guardarInfo = async () => {
    try {
      await updateRuta(rutaId, infoData);
      setEditingInfo(false);
      loadRuta();
      alert('Información de la ruta actualizada exitosamente');
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando ruta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <Button
          variant="secondary"
          onClick={onClose}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Volver a Rutas
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Información de la Ruta</h2>
          {!editingInfo ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingInfo(true)}
              className="flex items-center gap-2"
            >
              <Edit2 size={16} />
              Editar Información
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingInfo(false);
                  loadRuta();
                }}
                className="flex items-center gap-2"
              >
                <X size={16} />
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={guardarInfo}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Guardar
              </Button>
            </div>
          )}
        </div>

        {editingInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Código de Ruta"
                value={infoData.codigo_ruta}
                onChange={(e) => setInfoData({ ...infoData, codigo_ruta: e.target.value.toUpperCase() })}
                placeholder="PM-TEM-001"
              />
              <Input
                label="Estado"
                value={infoData.estado}
                onChange={(e) => setInfoData({ ...infoData, estado: e.target.value })}
              />
            </div>

            <Input
              label="Nombre de Ruta"
              value={infoData.nombre_ruta}
              onChange={(e) => setInfoData({ ...infoData, nombre_ruta: e.target.value })}
              placeholder="Puerto Montt - Temuco"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ciudad Origen"
                value={infoData.origen}
                onChange={(e) => setInfoData({ ...infoData, origen: e.target.value })}
                placeholder="Puerto Montt"
              />
              <Input
                label="Ciudad Destino"
                value={infoData.destino}
                onChange={(e) => setInfoData({ ...infoData, destino: e.target.value })}
                placeholder="Temuco"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={infoData.descripcion}
                onChange={(e) => setInfoData({ ...infoData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Descripción de la ruta..."
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {ruta.codigo_ruta} - {ruta.nombre_ruta}
              </h1>
              <p className="text-gray-600 mt-2">
                {ruta.origen} → {ruta.destino}
              </p>
              {ruta.descripcion && (
                <p className="text-sm text-gray-500 mt-1">{ruta.descripcion}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Distancia Total</div>
              <div className="text-2xl font-bold text-blue-600">
                {ruta.distancia_km || 0} km
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {Math.floor((ruta.tiempo_estimado_minutos || 0) / 60)}h {(ruta.tiempo_estimado_minutos || 0) % 60}min
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PARADAS CON TARIFAS */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="text-blue-600" size={24} />
            Paradas y Tarifas ({paradas.length})
          </h2>
          {!editingParadas ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditingParadas(true)}
              className="flex items-center gap-2"
            >
              <Edit2 size={16} />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingParadas(false);
                  loadRuta();
                }}
                className="flex items-center gap-2"
              >
                <X size={16} />
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={guardarParadas}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Guardar
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {paradas.map((parada, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                parada.es_origen || parada.es_destino
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-gray-50 border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                </div>

                <div className="flex-1">
                  {editingParadas && !parada.es_origen && !parada.es_destino ? (
                    <Input
                      value={parada.ciudad}
                      onChange={(e) => actualizarParada(index, 'ciudad', e.target.value)}
                      placeholder="Nombre de la ciudad"
                    />
                  ) : (
                    <div className="font-semibold text-gray-900">
                      {parada.ciudad}
                      {parada.es_origen && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          ORIGEN
                        </span>
                      )}
                      {parada.es_destino && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          DESTINO
                        </span>
                      )}
                    </div>
                  )}

                  {index > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="text-xs text-gray-600">Distancia desde anterior (km)</label>
                        {editingParadas ? (
                          <Input
                            type="number"
                            value={parada.distancia_desde_anterior_km || ''}
                            onChange={(e) => actualizarParada(index, 'distancia_desde_anterior_km', parseFloat(e.target.value))}
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-sm font-medium">{parada.distancia_desde_anterior_km || 0} km</div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-gray-600">Tiempo desde anterior (min)</label>
                        {editingParadas ? (
                          <Input
                            type="number"
                            value={parada.tiempo_desde_anterior_min || ''}
                            onChange={(e) => actualizarParada(index, 'tiempo_desde_anterior_min', parseInt(e.target.value))}
                            placeholder="0"
                          />
                        ) : (
                          <div className="text-sm font-medium">{parada.tiempo_desde_anterior_min || 0} min</div>
                        )}
                      </div>
                    </div>
                  )}

                  {!parada.es_origen && (
                    <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                      <div className="text-xs font-semibold text-gray-700 mb-2">
                        💰 Tarifas desde origen
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">Adulto</label>
                          {editingParadas ? (
                            <Input
                              type="number"
                              value={parada.tarifa_adulto || ''}
                              onChange={(e) => actualizarParada(index, 'tarifa_adulto', parseInt(e.target.value) || 0)}
                              placeholder="$0"
                            />
                          ) : (
                            <div className="text-sm font-semibold text-green-600">
                              ${(parada.tarifa_adulto || 0).toLocaleString('es-CL')}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-gray-600">Estudiante</label>
                          {editingParadas ? (
                            <Input
                              type="number"
                              value={parada.tarifa_estudiante || ''}
                              onChange={(e) => actualizarParada(index, 'tarifa_estudiante', parseInt(e.target.value) || 0)}
                              placeholder="$0"
                            />
                          ) : (
                            <div className="text-sm font-semibold text-green-600">
                              ${(parada.tarifa_estudiante || 0).toLocaleString('es-CL')}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-gray-600">3ra Edad</label>
                          {editingParadas ? (
                            <Input
                              type="number"
                              value={parada.tarifa_tercera_edad || ''}
                              onChange={(e) => actualizarParada(index, 'tarifa_tercera_edad', parseInt(e.target.value) || 0)}
                              placeholder="$0"
                            />
                          ) : (
                            <div className="text-sm font-semibold text-green-600">
                              ${(parada.tarifa_tercera_edad || 0).toLocaleString('es-CL')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {editingParadas && !parada.es_origen && !parada.es_destino && (
                  <button
                    onClick={() => eliminarParada(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {editingParadas && (
          <Button
            variant="secondary"
            onClick={agregarParadaIntermedia}
            className="w-full mt-4 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Agregar Parada Intermedia
          </Button>
        )}
      </div>
    </div>
  );
}