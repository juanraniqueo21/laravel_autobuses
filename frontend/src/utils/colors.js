/**
 * Esquemas de Colores Consistentes
 * Para mantener una identidad visual uniforme en toda la aplicación
 */

/**
 * Obtiene las clases de color para un tipo de contrato
 * @param {string} tipo - Tipo de contrato
 * @returns {string} Clases CSS de Tailwind
 */
export const getTipoContratoColor = (tipo) => {
  const colors = {
    'indefinido': 'bg-green-100 text-green-800 border-green-300',
    'plazo_fijo': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'practicante': 'bg-blue-100 text-blue-800 border-blue-300',
  };
  return colors[tipo] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Obtiene las clases de color para una severidad de alerta
 * @param {string} severidad - Nivel de severidad
 * @returns {string} Clases CSS de Tailwind
 */
export const getSeveridadColor = (severidad) => {
  const colors = {
    'critica': 'bg-red-100 text-red-800 border-red-300',
    'alta': 'bg-orange-100 text-orange-800 border-orange-300',
    'media': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'baja': 'bg-green-100 text-green-800 border-green-300',
  };
  return colors[severidad] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Obtiene las clases de color para un tipo de servicio de bus
 * @param {string} tipo - Tipo de servicio
 * @returns {string} Clases CSS de Tailwind
 */
export const getTipoServicioColor = (tipo) => {
  const colors = {
    'clasico': 'bg-gray-100 text-gray-800 border-gray-300',
    'semicama': 'bg-blue-100 text-blue-800 border-blue-300',
    'cama': 'bg-purple-100 text-purple-800 border-purple-300',
    'premium': 'bg-amber-100 text-amber-800 border-amber-300'
  };
  return colors[tipo?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Obtiene las clases de color para un estado de empleado
 * @param {string} estado - Estado del empleado
 * @returns {string} Clases CSS de Tailwind
 */
export const getEstadoEmpleadoColor = (estado) => {
  const colors = {
    'activo': 'bg-green-100 text-green-800 border-green-300',
    'licencia': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'suspendido': 'bg-orange-100 text-orange-800 border-orange-300',
    'terminado': 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Obtiene las clases de color para un estado de mantenimiento
 * @param {string} estado - Estado del mantenimiento
 * @returns {string} Clases CSS de Tailwind
 */
export const getEstadoMantenimientoColor = (estado) => {
  const colors = {
    'en_proceso': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'completado': 'bg-green-100 text-green-800 border-green-300',
    'cancelado': 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Obtiene las clases de color para un tipo de mantenimiento
 * @param {string} tipo - Tipo de mantenimiento
 * @returns {string} Clases CSS de Tailwind
 */
export const getTipoMantenimientoColor = (tipo) => {
  const colors = {
    'preventivo': 'bg-blue-100 text-blue-800 border-blue-300',
    'correctivo': 'bg-orange-100 text-orange-800 border-orange-300',
    'revision': 'bg-purple-100 text-purple-800 border-purple-300',
  };
  return colors[tipo] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Obtiene las clases de color para un estado de licencia
 * @param {string} estado - Estado de la licencia
 * @returns {string} Clases CSS de Tailwind
 */
export const getEstadoLicenciaColor = (estado) => {
  const colors = {
    'solicitado': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'aprobado': 'bg-green-100 text-green-800 border-green-300',
    'rechazado': 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Obtiene las clases de color para un tipo de licencia
 * @param {string} tipo - Tipo de licencia
 * @returns {string} Clases CSS de Tailwind
 */
export const getTipoLicenciaColor = (tipo) => {
  const colors = {
    'medica': 'bg-red-100 text-red-800 border-red-300',
    'administrativa': 'bg-blue-100 text-blue-800 border-blue-300',
    'permiso': 'bg-green-100 text-green-800 border-green-300',
  };
  return colors[tipo] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Obtiene clases de color para días restantes (usado en alertas de vencimiento)
 * @param {number} dias - Días restantes
 * @returns {string} Clases CSS de Tailwind
 */
export const getDiasRestantesColor = (dias) => {
  if (dias <= 7) return 'bg-red-100 text-red-800 border-red-300';
  if (dias <= 15) return 'bg-orange-100 text-orange-800 border-orange-300';
  if (dias <= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-green-100 text-green-800 border-green-300';
};

/**
 * Obtiene clases de color para cantidad de licencias (usado en rankings)
 * @param {number} cantidad - Cantidad de licencias
 * @returns {string} Clases CSS de Tailwind
 */
export const getCantidadLicenciasColor = (cantidad) => {
  if (cantidad >= 5) return 'bg-red-100 text-red-800 border-red-300';
  if (cantidad >= 3) return 'bg-orange-100 text-orange-800 border-orange-300';
  if (cantidad >= 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-green-100 text-green-800 border-green-300';
};

/**
 * Colores para gráficos (Recharts)
 */
export const CHART_COLORS = {
  primary: '#3b82f6',    // blue-500
  success: '#10b981',    // green-500
  warning: '#f59e0b',    // amber-500
  danger: '#ef4444',     // red-500
  purple: '#a855f7',     // purple-500
  orange: '#f97316',     // orange-500
  gray: '#6b7280',       // gray-500
};

/**
 * Array de colores para gráficos de múltiples series
 */
export const CHART_COLOR_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#a855f7', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ec4899', // pink
];
