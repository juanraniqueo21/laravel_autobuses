import React, { useEffect, useMemo, useState } from 'react';
import { 
  Users, AlertTriangle, CheckCircle2, Clock3, Briefcase, TrendingUp, 
  RefreshCcw, PieChart as PieIcon, FileText, TrendingDown, Ban,
  Home, BarChart3, AlertCircle, UserCheck
} from 'lucide-react';
import { 
  fetchEmpleados, fetchLicencias, 
  fetchAlertasContratos, fetchRankingLicencias, 
  fetchResumenContratos, fetchEmpleadosAltoRiesgo, 
  updateEmpleado 
} from '../services/api';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { useNotifications } from '../context/NotificationContext';
import MetricCard from '../components/cards/MetricCard';

export default function RrhhDashboardUnificado({ onNavigate }) {
  const [empleados, setEmpleados] = useState([]);
  const [licencias, setLicencias] = useState([]);
  const [alertasContratos, setAlertasContratos] = useState([]);
  const [rankingLicencias, setRankingLicencias] = useState([]);
  const [resumenContratos, setResumenContratos] = useState({});
  const [empleadosAltoRiesgo, setEmpleadosAltoRiesgo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesandoBaja, setProcesandoBaja] = useState(null);
  const [activeView, setActiveView] = useState('resumen'); // 'resumen', 'alertas', 'rendimiento', 'riesgo'

  const { addNotification } = useNotifications();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [emps, lic, alertas, ranking, resumen, altoRiesgo] = await Promise.all([
        fetchEmpleados(),
        fetchLicencias({}),
        fetchAlertasContratos(),
        fetchRankingLicencias(),
        fetchResumenContratos(),
        fetchEmpleadosAltoRiesgo(),
      ]);

      setEmpleados(emps || []);
      setLicencias(lic || []);
      setAlertasContratos(alertas.data || []);
      setRankingLicencias(ranking.data || []);
      setResumenContratos(resumen.data || {});
      setEmpleadosAltoRiesgo(altoRiesgo.data || []);
      setError(null);
    } catch (e) {
      const errorMsg = e.message || 'Error al cargar datos de RRHH';
      setError(errorMsg);
      addNotification('error', 'Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDarDeBaja = async (empleadoId, nombreCompleto) => {
    if (!window.confirm(`¿Está seguro de dar de baja a ${nombreCompleto}?\n\nEsta acción cambiará su estado a 'terminado'.`)) {
      return;
    }

    try {
      setProcesandoBaja(empleadoId);
      await updateEmpleado(empleadoId, { estado: 'terminado' });
      addNotification('success', 'Empleado dado de baja', `${nombreCompleto} ha sido dado de baja correctamente.`);
      loadData();
    } catch (error) {
      console.error('Error dando de baja:', error);
      addNotification('error', 'Error', 'No se pudo dar de baja al empleado.');
    } finally {
      setProcesandoBaja(null);
    }
  };

  // Funciones del primer componente
  const licenciaPorEmpleado = useMemo(() => {
    const map = {};
    licencias.forEach(l => {
      const id = l.empleado_id || l.empleado?.id;
      if (!id) return;
      map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [licencias]);

  const ahora = new Date();
  const diasRestantes = (fecha) => {
    if (!fecha) return null;
    return Math.round((new Date(fecha) - ahora) / 86400000);
  };

  const indefinidos = empleados.filter(e => e.tipo_contrato !== 'plazo_fijo');
  const plazoFijo = empleados.filter(e => e.tipo_contrato === 'plazo_fijo');
  const vencenPronto = plazoFijo.filter(e => {
    const d = diasRestantes(e.fecha_fin_contrato);
    return d !== null && d <= 30 && d >= 0;
  });

  // Funciones del segundo componente
  const getSeveridadColor = (severidad) => {
    const colors = {
      'critica': 'bg-red-100 text-red-800 border-red-300',
      'alta': 'bg-orange-100 text-orange-800 border-orange-300',
      'media': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'baja': 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[severidad] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTipoContratoColor = (tipo) => {
    const colors = {
      'indefinido': 'bg-green-100 text-green-800',
      'plazo_fijo': 'bg-yellow-100 text-yellow-800',
      'practicante': 'bg-blue-100 text-blue-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}-${mes}-${anio}`;
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Cargando dashboard de RRHH...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-2xl mx-auto mt-10">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-500" size={24} />
            <h2 className="text-xl font-bold text-red-800">Error al cargar datos</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard de Recursos Humanos</h1>
                <p className="text-gray-600">Gestión integral de contratos, licencias y rendimiento</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 text-gray-700 transition-colors"
            >
              <RefreshCcw size={18} />
              Actualizar
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
              >
                ← Volver
              </button>
            )}
          </div>
        </div>

        {/* Navegación */}
        <div className="mt-6 flex flex-wrap gap-2">
          <NavButton
            icon={<Home size={18} />}
            label="Resumen"
            active={activeView === 'resumen'}
            onClick={() => setActiveView('resumen')}
          />
          <NavButton
            icon={<AlertCircle size={18} />}
            label={`Alertas (${alertasContratos.length})`}
            active={activeView === 'alertas'}
            onClick={() => setActiveView('alertas')}
          />
          <NavButton
            icon={<BarChart3 size={18} />}
            label="Rendimiento"
            active={activeView === 'rendimiento'}
            onClick={() => setActiveView('rendimiento')}
          />
          <NavButton
            icon={<AlertTriangle size={18} />}
            label={`Alto Riesgo (${empleadosAltoRiesgo.length})`}
            active={activeView === 'riesgo'}
            onClick={() => setActiveView('riesgo')}
          />
          <NavButton
            icon={<UserCheck size={18} />}
            label="Listas"
            active={activeView === 'listas'}
            onClick={() => setActiveView('listas')}
          />
        </div>
      </div>

      {/* Vista: Resumen */}
      {activeView === 'resumen' && (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Empleados"
              value={empleados.length}
              icon={Users}
              color="blue"
              subtitle="Activos en sistema"
            />
            <MetricCard
              title="Indefinidos"
              value={indefinidos.length}
              icon={CheckCircle2}
              color="green"
              subtitle="Contratos permanentes"
            />
            <MetricCard
              title="Plazo Fijo"
              value={plazoFijo.length}
              icon={Briefcase}
              color="orange"
              subtitle="Contratos temporales"
            />
            <MetricCard
              title="Vencen Pronto"
              value={vencenPronto.length}
              icon={AlertTriangle}
              color="red"
              subtitle="En 30 días o menos"
            />
            <MetricCard
              title="Licencias Totales"
              value={licencias.length}
              icon={Clock3}
              color="purple"
              subtitle="Solicitudes registradas"
            />
            <MetricCard
              title="Practicantes"
              value={resumenContratos.practicante || 0}
              icon={Users}
              color="cyan"
              subtitle="En formación"
            />
            <MetricCard
              title="Alto Riesgo"
              value={empleadosAltoRiesgo.length}
              icon={AlertTriangle}
              color="red"
              subtitle="Renovación crítica"
            />
            <MetricCard
              title="Con Alertas"
              value={alertasContratos.length}
              icon={TrendingDown}
              color="yellow"
              subtitle="Requieren atención"
            />
          </div>

          {/* Gráficos y Listas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Contratos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PieIcon className="text-blue-600" size={20} />
                Distribución de Contratos
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Indefinido', value: indefinidos.length, color: '#10b981' },
                        { name: 'Plazo Fijo', value: plazoFijo.length, color: '#6366f1' },
                        { name: 'Practicantes', value: resumenContratos.practicante || 0, color: '#0ea5e9' },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#6366f1" />
                      <Cell fill="#0ea5e9" />
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Empleados']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Licencias */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="text-orange-600" size={20} />
                Top 5 - Más Licencias
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={empleados.slice(0,5).map(e => ({
                    nombre: `${e.user?.nombre?.substring(0,1)}. ${e.user?.apellido}`,
                    licencias: licenciaPorEmpleado[e.id] || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [value, 'Licencias']} />
                    <Bar dataKey="licencias" fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Vista: Alertas */}
      {activeView === 'alertas' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <AlertTriangle className="text-red-600" size={24} />
              Alertas de Contratos
              <span className="text-sm font-normal text-gray-500">
                ({alertasContratos.length} contratos próximos a vencer)
              </span>
            </h2>
          </div>
          {alertasContratos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Empleado</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Fecha Término</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Días Restantes</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Urgencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {alertasContratos.map((empleado) => (
                    <tr key={empleado.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{empleado.nombre} {empleado.apellido}</div>
                          <div className="text-sm text-gray-500">{empleado.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTipoContratoColor(empleado.tipo_contrato)}`}>
                          {empleado.tipo_contrato}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{formatFecha(empleado.fecha_termino)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          empleado.dias_restantes <= 7 ? 'bg-red-100 text-red-800' :
                          empleado.dias_restantes <= 15 ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {empleado.dias_restantes} días
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeveridadColor(empleado.severidad)}`}>
                          {empleado.severidad.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No hay alertas de contratos activas
            </div>
          )}
        </div>
      )}

      {/* Vista: Rendimiento */}
      {activeView === 'rendimiento' && (
        <div className="space-y-6">
          {/* Detector de Rendimiento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <TrendingDown className="text-orange-600" size={24} />
              Detector de Rendimiento
            </h3>
            <TablaRendimiento 
              empleados={empleados}
              licenciaPorEmpleado={licenciaPorEmpleado}
              rankingLicencias={rankingLicencias}
              onDarDeBaja={handleDarDeBaja}
              procesandoBaja={procesandoBaja}
            />
          </div>
        </div>
      )}

      {/* Vista: Alto Riesgo */}
      {activeView === 'riesgo' && empleadosAltoRiesgo.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Empleados de Alto Riesgo</h2>
              <p className="text-gray-600">Contrato vence pronto + Alto ausentismo</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>⚠️ Atención:</strong> Estos empleados combinan dos factores de riesgo.
              Se recomienda evaluar cuidadosamente su renovación.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Empleado</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Contrato</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Días Restantes</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Licencias</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {empleadosAltoRiesgo.map((empleado) => (
                  <tr key={empleado.id} className="hover:bg-red-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{empleado.nombre_completo}</div>
                      <div className="text-sm text-gray-500">{empleado.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTipoContratoColor(empleado.tipo_contrato)}`}>
                        {empleado.tipo_contrato}
                      </span>
                      <div className="text-xs text-gray-600 mt-1">Vence: {formatFecha(empleado.fecha_termino)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        empleado.dias_restantes <= 15 ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {empleado.dias_restantes} días
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                          {empleado.total_licencias}
                        </span>
                        <span className="text-sm text-gray-600">({empleado.total_dias_licencia} días)</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleDarDeBaja(empleado.id, empleado.nombre_completo)}
                        disabled={procesandoBaja === empleado.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                      >
                        {procesandoBaja === empleado.id ? (
                          <>
                            <span className="animate-spin">⟳</span>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Ban size={16} />
                            No Renovar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista: Listas */}
      {activeView === 'listas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-green-600" size={20} />
              Personal Indefinido
              <span className="text-sm font-normal text-gray-500 ml-2">({indefinidos.length})</span>
            </h3>
            <ListaEmpleados 
              empleados={indefinidos} 
              licenciaPorEmpleado={licenciaPorEmpleado} 
              alertaVencimiento={false}
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-orange-600" size={20} />
              Personal Plazo Fijo
              <span className="text-sm font-normal text-gray-500 ml-2">({plazoFijo.length})</span>
            </h3>
            <ListaEmpleados 
              empleados={plazoFijo} 
              licenciaPorEmpleado={licenciaPorEmpleado} 
              alertaVencimiento={true}
              diasCritico={30}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Componentes auxiliares
const NavButton = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
      active 
        ? 'bg-blue-600 text-white' 
        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const ListaEmpleados = ({ empleados, licenciaPorEmpleado, alertaVencimiento = true, diasCritico = 30 }) => {
  const ahora = new Date();
  const diasRestantes = (fecha) => {
    if (!fecha) return null;
    return Math.round((new Date(fecha) - ahora) / 86400000);
  };

  if (!empleados.length) return <p className="text-gray-500 text-center py-4">Sin registros</p>;

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
      {empleados.map((e) => {
        const d = diasRestantes(e.fecha_fin_contrato);
        const lic = licenciaPorEmpleado[e.id] || 0;
        const isCritico = alertaVencimiento && d !== null && d >= 0 && d <= diasCritico;
        return (
          <div 
            key={e.id} 
            className={`p-3 rounded-lg border flex justify-between items-center ${
              isCritico 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div>
              <p className="font-semibold text-gray-800">{e.user?.nombre} {e.user?.apellido}</p>
              <p className="text-xs text-gray-500">{e.email || 'Sin email'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-700">Licencias: {lic}</p>
              {isCritico && <p className="text-xs text-red-600 font-semibold">Vence en {d} días</p>}
              {e.fecha_fin_contrato && !isCritico && (
                <p className="text-xs text-gray-500">Vence: {new Date(e.fecha_fin_contrato).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TablaRendimiento = ({ empleados, licenciaPorEmpleado, rankingLicencias, onDarDeBaja, procesandoBaja }) => {
  const ahora = new Date();
  const diasRestantes = (fecha) => {
    if (!fecha) return null;
    return Math.round((new Date(fecha) - ahora) / 86400000);
  };

  // Usar datos de ranking si están disponibles, si no calcular localmente
  const rows = rankingLicencias.length > 0 
    ? rankingLicencias.map(r => ({
        ...r,
        lic: r.total_licencias,
        d: r.dias_restantes,
        vencimientoCritico: r.dias_restantes <= 30,
        sugerirNoRenovar: r.total_licencias >= 3
      }))
    : empleados.map(e => {
        const lic = licenciaPorEmpleado[e.id] || 0;
        const d = diasRestantes(e.fecha_fin_contrato);
        const vencimientoCritico = e.tipo_contrato === 'plazo_fijo' && d !== null && d <= 30;
        const sugerirNoRenovar = e.tipo_contrato === 'plazo_fijo' && lic >= 3;
        return { 
          id: e.id,
          nombre_completo: `${e.user?.nombre} ${e.user?.apellido}`,
          tipo_contrato: e.tipo_contrato,
          lic, 
          d, 
          vencimientoCritico, 
          sugerirNoRenovar,
          alerta_rendimiento: sugerirNoRenovar
        };
      });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Empleado</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Tipo Contrato</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Licencias</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((r, index) => (
            <tr key={r.id || index} className={r.vencimientoCritico ? 'bg-red-50' : 'hover:bg-gray-50'}>
              <td className="px-4 py-3">
                <div className="font-semibold text-gray-900">{r.nombre_completo}</div>
                {index < 3 && rankingLicencias.length > 0 && (
                  <span className="text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="capitalize">{r.tipo_contrato || 'N/A'}</span>
                  {r.vencimientoCritico && r.d && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full font-semibold">
                      Vence en {r.d}d
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  r.lic >= 5 ? 'bg-red-100 text-red-800' :
                  r.lic >= 3 ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {r.lic}
                </span>
              </td>
              <td className="px-4 py-3">
                {r.alerta_rendimiento ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                    ⚠️ ALERTA
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    ✓ Normal
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {r.sugerirNoRenovar && r.tipo_contrato === 'plazo_fijo' && (
                  <button
                    onClick={() => onDarDeBaja(r.id, r.nombre_completo)}
                    disabled={procesandoBaja === r.id}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    {procesandoBaja === r.id ? (
                      <>
                        <span className="animate-spin">⟳</span>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Ban size={14} />
                        No Renovar
                      </>
                    )}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};