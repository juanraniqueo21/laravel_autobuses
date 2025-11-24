import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Map, Users, BarChart2, Download, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';
import MetricCard from '../components/cards/MetricCard';
import { fetchViajes, fetchRutas } from '../services/api';

export default function LogisticPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    ingresosTotal: 0,
    ocupacionPromedio: 0,
    eficienciaRutas: 0,
    viajesTotal: 0,
  });
  const [topRutas, setTopRutas] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [viajesData, rutasData] = await Promise.all([
        fetchViajes(),
        fetchRutas()
      ]);

      // --- CÁLCULOS REALES (Funcionalidad) ---
      
      // 1. Total de Viajes (Solo completados cuentan para estadísticas históricas)
      const viajesCompletados = viajesData.filter(v => v.estado === 'completado');
      
      // 2. Ingresos (Simulado: Si tuvieras campo 'precio' o 'ingreso' en el viaje)
      // Como aún no tienes ventas de pasajes reales, esto será 0.
      const ingresos = viajesCompletados.reduce((acc, curr) => acc + (curr.ingreso_total || 0), 0);

      // 3. Ocupación (Simulado: pasajeros / capacidad)
      const ocupacion = viajesCompletados.length > 0 
        ? (viajesCompletados.reduce((acc, curr) => acc + (curr.pasajeros_count || 0), 0) / viajesCompletados.length) 
        : 0;

      // 4. Ranking de Rutas (Contar viajes por ruta)
      const rutasMap = {};
      viajesCompletados.forEach(v => {
        if (!rutasMap[v.ruta_id]) rutasMap[v.ruta_id] = { count: 0, nombre: v.ruta?.nombre_ruta || 'Ruta desconocida' };
        rutasMap[v.ruta_id].count += 1;
      });
      
      const ranking = Object.values(rutasMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5

      setMetrics({
        ingresosTotal: ingresos,
        ocupacionPromedio: Math.round(ocupacion), // Redondear porcentaje
        eficienciaRutas: viajesCompletados.length > 0 ? 100 : 0, // Placeholder lógico
        viajesTotal: viajesCompletados.length
      });
      
      setTopRutas(ranking);

    } catch (err) {
      console.error("Error cargando logística:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER CARD NUEVO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Logística y Reportes</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Análisis detallado de rendimiento y finanzas.</p>
          </div>
          <Button 
            variant="primary" 
            className="flex items-center gap-2 shadow-lg" 
            disabled={metrics.viajesTotal === 0}
          >
            <Download size={18} />
            Exportar Mensual
          </Button>
        </div>
        <TrendingUp className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Resumen de KPIs (Datos Reales o Ceros) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Ingresos del Mes"
          value={formatCurrency(metrics.ingresosTotal)}
          icon={DollarSign}
          color="green"
          subtitle={metrics.viajesTotal === 0 ? "Sin ingresos registrados" : "Total acumulado"}
        />
        <MetricCard
          title="Ocupación Promedio"
          value={`${metrics.ocupacionPromedio}%`}
          icon={Users}
          color="blue"
          subtitle="Pasajeros por viaje"
        />
        <MetricCard
          title="Viajes Completados"
          value={metrics.viajesTotal}
          icon={Map}
          color="purple"
          subtitle="Total ejecutados"
        />
      </div>

      {/* Sección Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfico Grande (Placeholder Funcional) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Evolución de Viajes
            </h2>
            <select className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
              <option>Este mes</option>
            </select>
          </div>
          
          {/* Estado Vacío vs Gráfico */}
          <div className="h-72 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
            {metrics.viajesTotal === 0 ? (
              <>
                <BarChart2 size={48} className="mb-3 opacity-30" />
                <p className="font-medium">No hay suficientes datos para mostrar el gráfico</p>
                <span className="text-xs mt-1">Comienza a registrar y completar viajes para ver estadísticas</span>
              </>
            ) : (
              // Aquí iría tu componente de gráficos real (ej: Recharts) cuando tengas datos
              <div className="text-center">
                <p className="font-bold text-blue-600 text-lg">Gráfico Generado</p>
                <p className="text-sm text-gray-500">{metrics.viajesTotal} puntos de datos encontrados</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel Lateral: Ranking de Rutas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Rutas Más Activas</h2>
          
          {topRutas.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin rutas registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topRutas.map((ruta, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                      index === 1 ? 'bg-gray-100 text-gray-700' : 
                      'bg-orange-50 text-orange-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ruta.nombre}</p>
                      <p className="text-xs text-gray-500">{ruta.count} viajes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Button variant="secondary" className="w-full justify-center" disabled={topRutas.length === 0}>
              Ver Detalle Completo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}