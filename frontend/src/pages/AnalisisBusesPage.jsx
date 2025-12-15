import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Percent, Calendar } from 'lucide-react';
import { fetchRentabilidadPorTipoServicio, fetchOcupacionPorTipoServicio, fetchResumenEjecutivo, fetchAnalisisServicioPdf } from '../services/api';
import MetricCard from '../components/cards/MetricCard';
import { useNotifications } from '../context/NotificationContext';

export default function AnalisisBusesPage() {
  const [rentabilidad, setRentabilidad] = useState([]);
  const [ocupacion, setOcupacion] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mesReporte, setMesReporte] = useState(new Date().getMonth() + 1);
  const [anioReporte, setAnioReporte] = useState(new Date().getFullYear());
  const [descargandoReporteServicio, setDescargandoReporteServicio] = useState(false);
  const { addNotification } = useNotifications();
  const mesesDisponibles = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];
  const aniosDisponibles = Array.from({ length: 3 }, (_, idx) => new Date().getFullYear() - idx);

  useEffect(() => {
    loadData();
  }, [fechaInicio, fechaFin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      console.log('🔍 Iniciando carga de datos...'); // ← AGREGADO

      const [rentData, ocupData, resData] = await Promise.all([
        fetchRentabilidadPorTipoServicio(params),
        fetchOcupacionPorTipoServicio(params),
        fetchResumenEjecutivo(params)
      ]);

      console.log('📊 Datos recibidos:');          // ← AGREGADO
      console.log('Rentabilidad:', rentData);      // ← AGREGADO
      console.log('Ocupación:', ocupData);         // ← AGREGADO
      console.log('Resumen:', resData);            // ← AGREGADO

      setRentabilidad(rentData || []);
      setOcupacion(ocupData || []);
      setResumen(resData);

      console.log('✅ Estados actualizados');      // ← AGREGADO
    } catch (error) {
      console.error('❌ Error cargando análisis:', error); // actualizado con el emoji
    } finally {
      setLoading(false);
    }
  };

  const descargarArchivo = (blob, nombreArchivo) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDescargarReporteServicio = async () => {
    try {
      setDescargandoReporteServicio(true);
      const blob = await fetchAnalisisServicioPdf({
        mes: mesReporte,
        anio: anioReporte,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      });
      const mesPadding = String(mesReporte).padStart(2, '0');
      descargarArchivo(blob, `analisis-servicio-${anioReporte}-${mesPadding}.pdf`);
      addNotification('success', 'Reporte mensual', 'Se descargó el PDF del análisis mensual.');
    } catch (error) {
      console.error('Error generando reporte mensual', error);
      addNotification('error', 'Reporte', 'No se pudo generar el PDF mensual.');
    } finally {
      setDescargandoReporteServicio(false);
    }
  };

  const getTipoServicioColor = (tipo) => {
    const colors = {
      'clasico': 'bg-gray-100 text-gray-800 border-gray-300',
      'semicama': 'bg-blue-100 text-blue-800 border-blue-300',
      'cama': 'bg-purple-100 text-purple-800 border-purple-300',
      'premium': 'bg-amber-100 text-amber-800 border-amber-300'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTipoServicioLabel = (tipo) => {
    const labels = {
      'clasico': 'Clásico',
      'semicama': 'Semicama',
      'cama': 'Cama',
      'premium': 'Premium'
    };
    return labels[tipo] || tipo;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando análisis...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Análisis de Tipos de Servicio</h1>
          <p className="mt-2 text-indigo-200 max-w-xl">
            Análisis de rentabilidad, ocupación y desempeño por tipo de servicio
          </p>
        </div>
        <BarChart3 className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <Calendar size={20} className="text-gray-500" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          {(fechaInicio || fechaFin) && (
            <button
              onClick={() => { setFechaInicio(''); setFechaFin(''); }}
              className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Limpiar
            </button>
          )}
      </div>
    </div>

    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-end justify-between">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mes del reporte</label>
          <select
            value={mesReporte}
            onChange={(e) => setMesReporte(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          >
            {mesesDisponibles.map((mes) => (
              <option key={mes.value} value={mes.value}>{mes.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Año del reporte</label>
          <select
            value={anioReporte}
            onChange={(e) => setAnioReporte(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
          >
            {aniosDisponibles.map((anio) => (
              <option key={anio} value={anio}>{anio}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={handleDescargarReporteServicio}
        disabled={descargandoReporteServicio}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${descargandoReporteServicio ? 'bg-indigo-100 text-indigo-400 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
      >
        {descargandoReporteServicio ? 'Generando PDF...' : 'Descargar reporte mensual'}
      </button>
    </div>

      {/* Resumen Ejecutivo */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Viajes"
            value={resumen.total_viajes.toLocaleString()}
            icon={TrendingUp}
            color="blue"
          />
          <MetricCard
            title="Total Pasajeros"
            value={resumen.total_pasajeros.toLocaleString()}
            icon={Users}
            color="green"
          />
          <MetricCard
            title="Ingresos Totales"
            value={formatCurrency(resumen.total_ingresos)}
            icon={DollarSign}
            color="indigo"
          />
          <MetricCard
            title="Ganancia Neta"
            value={formatCurrency(resumen.ganancia_neta)}
            icon={DollarSign}
            color="emerald"
          />
        </div>
      )}

      {/* Análisis de Rentabilidad por Tipo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign size={24} className="text-indigo-600" />
          Rentabilidad por Tipo de Servicio
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Viajes</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Pasajeros</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ingresos</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Gastos Comb.</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ganancia</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Margen %</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Ocupación %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rentabilidad.map((item) => (
                <tr key={item.tipo_servicio} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getTipoServicioColor(item.tipo_servicio.toLowerCase())}`}>
                      {item.tipo_servicio}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-gray-900">{item.total_viajes}</td>
                  <td className="px-4 py-4 text-right text-gray-700">{item.total_pasajeros.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-semibold text-green-700">{formatCurrency(item.total_ingresos)}</td>
                  <td className="px-4 py-4 text-right text-red-600">{formatCurrency(item.total_gastos)}</td>
                  <td className="px-4 py-4 text-right font-bold text-emerald-700">{formatCurrency(item.ganancia_neta)}</td>
                  <td className="px-4 py-4 text-right">
                    <span className={`px-2 py-1 rounded text-sm font-bold ${item.margen_porcentaje >= 50 ? 'bg-green-100 text-green-800' : item.margen_porcentaje >= 30 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {item.margen_porcentaje.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`px-2 py-1 rounded text-sm font-bold ${item.tasa_ocupacion_promedio >= 80 ? 'bg-green-100 text-green-800' : item.tasa_ocupacion_promedio >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {item.tasa_ocupacion_promedio.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rentabilidad.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay datos de rentabilidad para el período seleccionado
          </div>
        )}
      </div>

      {/* Análisis de Ocupación */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Percent size={24} className="text-indigo-600" />
          Análisis de Ocupación
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ocupacion.map((item) => (
            <div key={item.tipo_servicio} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 border ${getTipoServicioColor(item.tipo_servicio.toLowerCase())}`}>
                {item.tipo_servicio}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Tasa Ocupación</div>
                  <div className="text-2xl font-bold text-gray-900">{item.tasa_ocupacion_promedio.toFixed(1)}%</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500">Máxima</div>
                    <div className="text-sm font-semibold text-green-700">{item.tasa_ocupacion_maxima.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Mínima</div>
                    <div className="text-sm font-semibold text-red-700">{item.tasa_ocupacion_minima.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">Pasajeros Promedio</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {item.pasajeros_promedio.toFixed(1)} / {item.capacidad_promedio.toFixed(0)} pax
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">Total Viajes</div>
                  <div className="text-sm font-semibold text-indigo-700">{item.total_viajes}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {ocupacion.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay datos de ocupación para el período seleccionado
          </div>
        )}
      </div>

    </div>
  );
}
