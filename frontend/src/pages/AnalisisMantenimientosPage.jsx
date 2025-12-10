import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, DollarSign, Calendar, TrendingUp, Power } from 'lucide-react';
import {
  fetchBusesConMasMantenimientos,
  fetchTiposFallasMasComunes,
  fetchCostosMantenimientoPorBus,
  fetchBusesDisponiblesEmergencia,
  activarBusEmergencia
} from '../services/api';
import MetricCard from '../components/cards/MetricCard';
import { useNotifications } from '../context/NotificationContext';

export default function AnalisisMantenimientosPage() {
  const [busesMantenimientos, setBusesMantenimientos] = useState([]);
  const [tiposFallas, setTiposFallas] = useState([]);
  const [costosMantenimiento, setCostosMantenimiento] = useState([]);
  const [busesEmergencia, setBusesEmergencia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [activandoBus, setActivandoBus] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState(false);

  const { addNotification } = useNotifications();

  useEffect(() => {
    loadData();
  }, [mes, anio, filtroActivo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtroActivo) {
        params.mes = mes;
        params.anio = anio;
      }

      const [busesData, fallasData, costosData, emergenciaData] = await Promise.all([
        fetchBusesConMasMantenimientos(params),
        fetchTiposFallasMasComunes(params),
        fetchCostosMantenimientoPorBus(params),
        fetchBusesDisponiblesEmergencia()
      ]);

      setBusesMantenimientos(busesData || []);
      setTiposFallas(fallasData || []);
      setCostosMantenimiento(costosData || []);
      setBusesEmergencia(emergenciaData || []);
    } catch (error) {
      console.error('Error cargando análisis de mantenimientos:', error);
      addNotification('error', 'Error', 'No se pudieron cargar los datos de mantenimiento.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivarBusEmergencia = async (busId, patente) => {
    if (!window.confirm(`¿Está seguro de activar el bus ${patente} en modo emergencia? El mantenimiento quedará pendiente.`)) {
      return;
    }

    try {
      setActivandoBus(busId);
      await activarBusEmergencia(busId);
      addNotification('success', 'Bus Activado', `El bus ${patente} ha sido activado para servicio de emergencia.`);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error activando bus:', error);
      addNotification('error', 'Error', 'No se pudo activar el bus en emergencia.');
    } finally {
      setActivandoBus(null);
    }
  };

  const getTipoServicioColor = (tipo) => {
    const colors = {
      'clasico': 'bg-gray-100 text-gray-800 border-gray-300',
      'semicama': 'bg-blue-100 text-blue-800 border-blue-300',
      'cama': 'bg-purple-100 text-purple-800 border-purple-300',
      'premium': 'bg-amber-100 text-amber-800 border-amber-300'
    };
    return colors[tipo?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
  };

  const getMesNombre = (m) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[m - 1];
  };

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    // Si la fecha viene con formato ISO (2025-11-10T03:00:00.000000Z), extraer solo la fecha
    const fecha = fechaString.split('T')[0];
    // Convertir de YYYY-MM-DD a DD-MM-YYYY
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}-${mes}-${anio}`;
  };

  // Calcular métricas totales
  const totalMantenimientos = busesMantenimientos.reduce((sum, bus) => sum + (bus.total_mantenimientos || 0), 0);
  const totalCostos = costosMantenimiento.reduce((sum, bus) => sum + (bus.costo_total_mantenimiento || 0), 0);
  // Buses en mantenimiento = todos los buses en el endpoint de emergencia (que están en proceso)
  const busesEnMantenimiento = busesEmergencia.length;
  const busesActivablesEmergencia = busesEmergencia.filter(bus => bus.activable_emergencia).length;

  if (loading) {
    return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando análisis de mantenimientos...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-900 to-orange-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Análisis de Mantenimientos</h1>
          <p className="mt-2 text-orange-200 max-w-xl">
            Análisis detallado del historial de mantenimientos, fallas y costos de la flota
          </p>
        </div>
        <Wrench className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Filtros de Período */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <Calendar size={20} className="text-gray-500" />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-semibold text-gray-700">Filtrar por período</span>
            </label>
          </div>

          {filtroActivo && (
            <>
              <select
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>{getMesNombre(m)}</option>
                ))}
              </select>

              <select
                value={anio}
                onChange={(e) => setAnio(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}

          {filtroActivo && (
            <div className="ml-auto px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 font-medium">
              Mostrando: {getMesNombre(mes)} {anio}
            </div>
          )}
        </div>
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Mantenimientos"
          value={totalMantenimientos.toLocaleString()}
          icon={Wrench}
          color="orange"
        />
        <MetricCard
          title="Buses en Mantenimiento"
          value={busesEnMantenimiento.toLocaleString()}
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          title="Costo Total"
          value={formatCurrency(totalCostos)}
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Activables Emergencia"
          value={busesActivablesEmergencia.toLocaleString()}
          icon={Power}
          color="green"
        />
      </div>

      {/* Buses Disponibles para Emergencia */}
      {busesEmergencia.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Power size={24} className="text-green-600" />
            Buses Disponibles para Activación de Emergencia
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({busesActivablesEmergencia} de {busesEmergencia.length} activables)
            </span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Bus</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo Servicio</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo Mant.</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Fecha Inicio</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Fecha Término</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Días</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Mecánico</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Prioridad</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {busesEmergencia.map((bus) => (
                  <tr key={bus.bus_id} className={`hover:bg-gray-50 transition-colors ${!bus.activable_emergencia ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-900">{bus.patente}</div>
                      <div className="text-xs text-gray-500">{bus.marca} {bus.modelo} ({bus.capacidad_pasajeros} pax)</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${getTipoServicioColor(bus.tipo_servicio)}`}>
                        {bus.tipo_servicio}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${bus.tipo_mantenimiento === 'Preventivo' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {bus.tipo_mantenimiento}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 max-w-xs truncate">{bus.descripcion}</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-700">
                      {formatFecha(bus.fecha_inicio)}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-700">
                      {formatFecha(bus.fecha_termino_estimada)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm font-semibold text-gray-900">
                        {bus.dias_en_mantenimiento}d
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{bus.mecanico_asignado || 'N/A'}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                        bus.prioridad_mantenimiento === 'baja' ? 'bg-green-100 text-green-800' :
                        bus.prioridad_mantenimiento === 'media' ? 'bg-yellow-100 text-yellow-800' :
                        bus.prioridad_mantenimiento === 'alta' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bus.prioridad_mantenimiento}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {bus.activable_emergencia ? (
                        <button
                          onClick={() => handleActivarBusEmergencia(bus.bus_id, bus.patente)}
                          disabled={activandoBus === bus.bus_id}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 mx-auto"
                        >
                          {activandoBus === bus.bus_id ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Activando...
                            </>
                          ) : (
                            <>
                              <Power size={14} />
                              Activar
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No activable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {busesEmergencia.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay buses en mantenimiento actualmente
            </div>
          )}
        </div>
      )}

      {/* Buses con Más Mantenimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp size={24} className="text-orange-600" />
          Top Buses con Más Mantenimientos
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Patente</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Bus</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo Servicio</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Preventivos</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Correctivos</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">En Proceso</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Costo Total</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {busesMantenimientos.map((bus) => (
                <tr key={bus.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-gray-900">{bus.patente}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{bus.marca} {bus.modelo}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${getTipoServicioColor(bus.tipo_servicio)}`}>
                      {bus.tipo_servicio}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded font-bold">
                      {bus.total_mantenimientos}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-blue-700 font-semibold">{bus.preventivos}</td>
                  <td className="px-4 py-4 text-right text-red-700 font-semibold">{bus.correctivos}</td>
                  <td className="px-4 py-4 text-right text-yellow-700 font-semibold">{bus.en_proceso}</td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900">{formatCurrency(bus.costo_total_mantenimientos)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      bus.estado_bus === 'operativo' ? 'bg-green-100 text-green-800' :
                      bus.estado_bus === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bus.estado_bus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {busesMantenimientos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay datos de mantenimientos para el período seleccionado
          </div>
        )}
      </div>

      {/* Tipos de Fallas Más Comunes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-600" />
            Tipos de Fallas Más Comunes
          </h2>

          <div className="space-y-3">
            {tiposFallas.map((falla, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{falla.tipo_falla}</h3>
                    <p className="text-sm text-gray-500 mt-1">Ocurrencias: {falla.cantidad}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                    #{index + 1}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500">Promedio</div>
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(falla.costo_promedio)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Mínimo</div>
                    <div className="text-sm font-semibold text-green-700">{formatCurrency(falla.costo_minimo)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Máximo</div>
                    <div className="text-sm font-semibold text-red-700">{formatCurrency(falla.costo_maximo)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tiposFallas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay datos de fallas para el período seleccionado
            </div>
          )}
        </div>

        {/* Costos de Mantenimiento por Bus */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign size={24} className="text-blue-600" />
            Top Costos de Mantenimiento
          </h2>

          <div className="space-y-3">
            {costosMantenimiento.slice(0, 10).map((bus, index) => (
              <div key={bus.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{bus.patente}</h3>
                    <p className="text-sm text-gray-500">{bus.marca} {bus.modelo}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${getTipoServicioColor(bus.tipo_servicio)}`}>
                    {bus.tipo_servicio}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Costo Total:</span>
                    <span className="text-lg font-bold text-blue-700">{formatCurrency(bus.costo_total_mantenimiento)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Promedio por mantenimiento:</span>
                    <span className="font-semibold text-gray-700">{formatCurrency(bus.costo_promedio_mantenimiento)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>Total mantenimientos:</span>
                    <span className="font-semibold text-gray-700">{bus.total_mantenimientos}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {costosMantenimiento.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay datos de costos para el período seleccionado
            </div>
          )}
        </div>
      </div>

    </div>
  );
}