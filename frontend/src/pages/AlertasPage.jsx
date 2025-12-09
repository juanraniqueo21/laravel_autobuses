import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, AlertCircle, Info, CheckCircle, TrendingUp, DollarSign,
  Calendar, Bell, BellOff, Filter, X
} from 'lucide-react';
import { fetchAlertas, fetchPredicciones } from '../services/api';
import MetricCard from '../components/cards/MetricCard';

export default function AlertasPage() {
  const [alertas, setAlertas] = useState([]);
  const [predicciones, setPredicciones] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroSeveridad, setFiltroSeveridad] = useState('todas');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertasData, prediccionesData] = await Promise.all([
        fetchAlertas(),
        fetchPredicciones()
      ]);

      setAlertas(alertasData.alertas || []);
      setPredicciones(prediccionesData);
    } catch (error) {
      console.error('Error cargando alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeveridadColor = (severidad) => {
    const colors = {
      'critica': 'bg-red-100 text-red-800 border-red-300',
      'alta': 'bg-orange-100 text-orange-800 border-orange-300',
      'media': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'baja': 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[severidad] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getSeveridadIcon = (severidad) => {
    const icons = {
      'critica': <AlertTriangle className="h-5 w-5" />,
      'alta': <AlertCircle className="h-5 w-5" />,
      'media': <Info className="h-5 w-5" />,
      'baja': <Bell className="h-5 w-5" />,
    };
    return icons[severidad] || <Info className="h-5 w-5" />;
  };

  const alertasFiltradas = alertas.filter(alerta => {
    if (filtroSeveridad !== 'todas' && alerta.severidad !== filtroSeveridad) return false;
    if (filtroCategoria !== 'todas' && alerta.categoria !== filtroCategoria) return false;
    return true;
  });

  const categorias = [...new Set(alertas.map(a => a.categoria))];
  const totalAlertas = alertasFiltradas.length;
  const criticas = alertasFiltradas.filter(a => a.severidad === 'critica').length;
  const altas = alertasFiltradas.filter(a => a.severidad === 'alta').length;
  const medias = alertasFiltradas.filter(a => a.severidad === 'media').length;

  if (loading) {
    return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando alertas inteligentes...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-900 to-orange-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-10 w-10" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sistema de Alertas Inteligentes</h1>
              <p className="mt-2 text-orange-200 max-w-2xl">
                Detección automática de problemas, predicciones y recomendaciones basadas en análisis de datos
              </p>
            </div>
          </div>
        </div>
        <Bell className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Métricas de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total de Alertas"
          value={totalAlertas.toLocaleString()}
          icon={Bell}
          color="blue"
        />
        <MetricCard
          title="Críticas"
          value={criticas.toLocaleString()}
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          title="Altas"
          value={altas.toLocaleString()}
          icon={AlertCircle}
          color="orange"
        />
        <MetricCard
          title="Medias"
          value={medias.toLocaleString()}
          icon={Info}
          color="yellow"
        />
      </div>

      {/* Predicciones */}
      {predicciones && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-blue-600" />
            Predicciones y Proyecciones
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Costos de Mantenimiento */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={20} className="text-orange-600" />
                <h3 className="font-bold text-gray-900">Costos de Mantenimiento</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Promedio mensual</div>
                  <div className="text-lg font-bold text-gray-900">
                    ${predicciones.costos_proximos_30dias?.costo_promedio_mensual?.toLocaleString('es-CL') || 0}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500">Proyección próximos 30 días</div>
                  <div className="text-lg font-bold text-orange-700">
                    ${predicciones.costos_proximos_30dias?.proyeccion_30_dias?.toLocaleString('es-CL') || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Rentabilidad */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={20} className="text-green-600" />
                <h3 className="font-bold text-gray-900">Rentabilidad</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Ganancia últimos 30 días</div>
                  <div className="text-lg font-bold text-green-700">
                    ${predicciones.rentabilidad_esperada?.ganancia_ultimos_30dias?.toLocaleString('es-CL') || 0}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500">Proyección mes siguiente</div>
                  <div className="text-lg font-bold text-blue-700">
                    ${predicciones.rentabilidad_esperada?.proyeccion_mes_siguiente?.toLocaleString('es-CL') || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Rutas con Mayor Demanda */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={20} className="text-purple-600" />
                <h3 className="font-bold text-gray-900">Top Rutas</h3>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {predicciones.demanda_por_ruta?.slice(0, 3).map((ruta, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 truncate">{ruta.nombre_ruta}</span>
                    <span className="text-sm font-bold text-purple-700">{Math.round(ruta.ocupacion_promedio)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter size={20} className="text-gray-500" />

          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-gray-600">Severidad:</label>
            <select
              value={filtroSeveridad}
              onChange={(e) => setFiltroSeveridad(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="todas">Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-gray-600">Categoría:</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="todas">Todas</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {(filtroSeveridad !== 'todas' || filtroCategoria !== 'todas') && (
            <button
              onClick={() => { setFiltroSeveridad('todas'); setFiltroCategoria('todas'); }}
              className="ml-auto px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <X size={16} />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {alertasFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BellOff className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No hay alertas</h3>
            <p className="text-gray-500">
              {filtroSeveridad !== 'todas' || filtroCategoria !== 'todas'
                ? 'No hay alertas con los filtros seleccionados'
                : 'El sistema no ha detectado ninguna alerta en este momento'}
            </p>
          </div>
        ) : (
          alertasFiltradas.map((alerta, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-sm border-2 ${getSeveridadColor(alerta.severidad)} p-6 transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 p-3 rounded-full ${getSeveridadColor(alerta.severidad)}`}>
                  {getSeveridadIcon(alerta.severidad)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{alerta.titulo}</h3>
                      <span className="text-xs text-gray-500">{alerta.categoria} • {alerta.tipo}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getSeveridadColor(alerta.severidad)}`}>
                      {alerta.severidad}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3">{alerta.mensaje}</p>

                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <CheckCircle size={16} className="text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-blue-900">
                      <span className="font-bold">Acción sugerida:</span> {alerta.accion_sugerida}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
