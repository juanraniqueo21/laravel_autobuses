import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, AlertCircle, Bus, Wrench, CheckCircle, BarChart2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = '/api';

// Helper functions
const getAuthToken = () => {
  return localStorage.getItem('token');
};

const fetchOptions = (method = 'GET', body = null, requiresAuth = true) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
};

// API Methods
const fetchEstadisticasLogistica = async (mes = null, anio = null) => {
  const params = new URLSearchParams();
  if (mes) params.append('mes', mes);
  if (anio) params.append('anio', anio);

  const url = `${API_URL}/reports/logistica${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener estadísticas de logística');
  const data = await response.json();
  return data.success ? data.data : data;
};

const fetchViajesPorDia = async (mes = null, anio = null) => {
  const params = new URLSearchParams();
  if (mes) params.append('mes', mes);
  if (anio) params.append('anio', anio);

  const url = `${API_URL}/reports/viajes-por-dia${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener viajes por día');
  const data = await response.json();
  return data.success ? data.data : data;
};

const fetchEstadoBuses = async () => {
  const response = await fetch(`${API_URL}/reports/estado-buses`, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener estado de buses');
  const data = await response.json();
  return data.success ? data.data : data;
};

const fetchRutasActivas = async (mes = null, anio = null) => {
  const params = new URLSearchParams();
  if (mes) params.append('mes', mes);
  if (anio) params.append('anio', anio);

  const url = `${API_URL}/reports/rutas-activas${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener rutas activas');
  const data = await response.json();
  return data.success ? data.data : data;
};

const fetchOcupacionBuses = async (mes = null, anio = null) => {
  const params = new URLSearchParams();
  if (mes) params.append('mes', mes);
  if (anio) params.append('anio', anio);

  const url = `${API_URL}/reports/ocupacion-buses${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener ocupación de buses');
  const data = await response.json();
  return data.success ? data.data : data;
};

const descargarReportePDF = async (mes, anio) => {
  try {
    const token = getAuthToken();
    const params = new URLSearchParams();
    params.append('mes', mes);
    params.append('anio', anio);

    const response = await fetch(`${API_URL}/reports/exportar-pdf?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Error al descargar PDF');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Logistica_${anio}_${mes}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    throw error;
  }
};

// MetricCard Component
const MetricCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl border p-6 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <Icon size={24} className={`text-${color}-600 opacity-50`} />
      </div>
    </div>
  );
};

// Main Component
export default function LogisticPage() {
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  
  const [stats, setStats] = useState(null);
  const [viajesDia, setViajesDia] = useState([]);
  const [estadoBuses, setEstadoBuses] = useState([]);
  const [rutasActivas, setRutasActivas] = useState([]);
  const [ocupacionBuses, setOcupacionBuses] = useState([]);
  
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    loadData();
  }, [mes, anio]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, viajesData, busesData, rutasData, ocupacionData] = await Promise.all([
        fetchEstadisticasLogistica(mes, anio),
        fetchViajesPorDia(mes, anio),
        fetchEstadoBuses(),
        fetchRutasActivas(mes, anio),
        fetchOcupacionBuses(mes, anio),
      ]);

      setStats(statsData);
      setViajesDia(viajesData || []);
      setEstadoBuses(busesData || []);
      setRutasActivas(rutasData || []);
      setOcupacionBuses(ocupacionData || []);
    } catch (err) {
      console.error('Error cargando logística:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = async () => {
    try {
      setExportando(true);
      await descargarReportePDF(mes, anio);
    } catch (err) {
      setError('Error al exportar PDF: ' + err.message);
    } finally {
      setExportando(false);
    }
  };

  const getMesNombre = (m) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[m - 1];
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Logística y Reportes</h1>
          <p className="mt-2 text-slate-300">Análisis detallado de rendimiento y operaciones</p>
        </div>
        <TrendingUp className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* CONTROLES DE PERÍODO */}
      <div className="flex gap-4 mb-8 items-center">
        <select 
          value={mes} 
          onChange={(e) => setMes(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
            <option key={m} value={m}>{getMesNombre(m)}</option>
          ))}
        </select>

        <select 
          value={anio} 
          onChange={(e) => setAnio(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button
          onClick={handleExportar}
          disabled={exportando}
          className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-semibold"
        >
          <Download size={18} />
          {exportando ? 'Exportando...' : 'Exportar PDF'}
        </button>
      </div>

      {/* KPIs PRINCIPALES */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Buses"
            value={stats.buses.total}
            icon={Bus}
            color="blue"
            subtitle={`${stats.buses.operativos} operativos`}
          />
          <MetricCard
            title="Viajes Completados"
            value={stats.viajes.completados}
            icon={CheckCircle}
            color="green"
            subtitle={`${stats.viajes.total} total`}
          />
          <MetricCard
            title="Eficiencia"
            value={`${stats.eficiencia}%`}
            icon={TrendingUp}
            color="purple"
            subtitle="Tasa de viajes completados"
          />
          <MetricCard
            title="Mantenimientos"
            value={stats.mantenimientos.completados}
            icon={Wrench}
            color="orange"
            subtitle={`${stats.mantenimientos.total} total`}
          />
        </div>
      )}

      {/* GRÁFICOS PRINCIPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Gráfico de Viajes por Día */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Evolución de Viajes
          </h2>
          
          {viajesDia.length === 0 ? (
            <div className="h-72 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <BarChart2 size={48} className="mx-auto mb-3 opacity-30" />
                <p>No hay datos disponibles</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viajesDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completados" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="programados" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="cancelados" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfico de Estado de Buses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Estado de Buses</h2>
          
          {estadoBuses.length === 0 ? (
            <div className="h-72 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Sin datos</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={estadoBuses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {estadoBuses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* GRÁFICOS SECUNDARIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Rutas Más Activas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Rutas Más Activas</h2>
          
          {rutasActivas.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
              <p>Sin datos disponibles</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rutasActivas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ruta" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_viajes" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ocupación de Buses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Buses Más Utilizados</h2>
          
          {ocupacionBuses.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Bus size={32} className="mx-auto mb-2 opacity-30" />
              <p>Sin datos disponibles</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ocupacionBuses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="patente" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="viajes" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* TABLA RESUMEN */}
      {stats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Resumen Mensual</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Turnos</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.turnos.total}</p>
              <p className="text-xs text-blue-600 mt-1">{stats.turnos.completados} completados</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <h3 className="text-sm font-semibold text-green-900 mb-2">Viajes</h3>
              <p className="text-2xl font-bold text-green-600">{stats.viajes.total}</p>
              <p className="text-xs text-green-600 mt-1">{stats.viajes.completados} completados</p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <h3 className="text-sm font-semibold text-orange-900 mb-2">Mantenimientos</h3>
              <p className="text-2xl font-bold text-orange-600">{stats.mantenimientos.total}</p>
              <p className="text-xs text-orange-600 mt-1">{stats.mantenimientos.completados} completados</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}