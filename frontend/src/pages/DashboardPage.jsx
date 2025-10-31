import React, { useState, useEffect } from 'react';
import { Users, Bus, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import MetricCard from '../components/cards/MetricCard';
import Button from '../components/common/Button';
import { fetchConductores, fetchAsistentes, fetchBuses, fetchViajes } from '../services/api';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    conductoresTotal: 0,
    conductoresActivos: 0,
    conductoresLicenciaVencida: 0,
    asistentesTotal: 0,
    asistentesActivos: 0,
    busesTotal: 0,
    busesOperativos: 0,
    busesMantenimiento: 0,
    viajesHoy: 0,
    viajesCompletados: 0,
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [conductoresData, asistentesData, busesData, viajesData] = await Promise.all([
        fetchConductores(),
        fetchAsistentes(),
        fetchBuses(),
        fetchViajes(),
      ]);

      const today = new Date().toISOString().split('T')[0];

      const conductoresActivos = conductoresData.filter(c => c.estado === 'activo').length;
      const conductoresLicenciaVencida = conductoresData.filter(c => {
        const vencimiento = new Date(c.fecha_vencimiento_licencia);
        return vencimiento < new Date();
      }).length;

      const asistentesActivos = asistentesData.filter(a => a.estado === 'activo').length;
      const busesOperativos = busesData.filter(b => b.estado === 'operativo').length;
      const busesMantenimiento = busesData.filter(b => b.estado === 'mantenimiento').length;
      const viajesHoy = viajesData.filter(v => v.fecha_hora_salida.split('T')[0] === today).length;
      const viajesCompletados = viajesData.filter(v => v.estado === 'completado').length;

      setMetrics({
        conductoresTotal: conductoresData.length,
        conductoresActivos,
        conductoresLicenciaVencida,
        asistentesTotal: asistentesData.length,
        asistentesActivos,
        busesTotal: busesData.length,
        busesOperativos,
        busesMantenimiento,
        viajesHoy,
        viajesCompletados,
      });

      setError(null);
    } catch (err) {
      setError('Error al cargar métricas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Resumen general del sistema</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Fila 1: Conductores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricCard
          title="Conductores"
          value={metrics.conductoresTotal}
          icon={Users}
          color="blue"
          subtitle={`${metrics.conductoresActivos} activos`}
        />
        <MetricCard
          title="Licencias Vencidas"
          value={metrics.conductoresLicenciaVencida}
          icon={AlertCircle}
          color="red"
          subtitle="⚠️ Requiere atención"
        />
        <MetricCard
          title="Asistentes"
          value={metrics.asistentesTotal}
          icon={Users}
          color="green"
          subtitle={`${metrics.asistentesActivos} activos`}
        />
      </div>

      {/* Fila 2: Buses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricCard
          title="Buses"
          value={metrics.busesTotal}
          icon={Bus}
          color="blue"
          subtitle={`${metrics.busesOperativos} operativos`}
        />
        <MetricCard
          title="En Mantenimiento"
          value={metrics.busesMantenimiento}
          icon={Zap}
          color="yellow"
          subtitle="Fuera de servicio"
        />
        <MetricCard
          title="Viajes Hoy"
          value={metrics.viajesHoy}
          icon={TrendingUp}
          color="green"
          subtitle="Programados"
        />
      </div>

      {/* Fila 3: Viajes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Viajes Completados"
          value={metrics.viajesCompletados}
          icon={TrendingUp}
          color="green"
          subtitle="✅ Exitosos"
        />
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-4">
        <Button variant="primary" size="lg">
          Crear Viaje
        </Button>
        <Button variant="outline" size="lg">
          Ver Logística
        </Button>
      </div>
    </div>
  );
}