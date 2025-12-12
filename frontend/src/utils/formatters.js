/**
 * Utilidades de Formateo Compartidas
 * Para mantener consistencia en toda la aplicación
 */

/**
 * Formatea una fecha de formato ISO a DD-MM-YYYY
 * @param {string} fechaString - Fecha en formato ISO o YYYY-MM-DD
 * @returns {string} Fecha formateada DD-MM-YYYY o 'N/A'
 */
export const formatFecha = (fechaString) => {
  if (!fechaString) return 'N/A';
  // Si la fecha viene con formato ISO (2025-11-10T03:00:00.000000Z), extraer solo la fecha
  const fecha = fechaString.split('T')[0];
  // Convertir de YYYY-MM-DD a DD-MM-YYYY
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}-${mes}-${anio}`;
};

/**
 * Formatea una cantidad a formato de moneda chilena (CLP)
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada en pesos chilenos
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

/**
 * Obtiene el nombre del mes dado su número (1-12)
 * @param {number} m - Número del mes (1-12)
 * @returns {string} Nombre del mes
 */
export const getMesNombre = (m) => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[m - 1] || 'Mes inválido';
};

/**
 * Obtiene el nombre del mes en formato corto
 * @param {number} m - Número del mes (1-12)
 * @returns {string} Nombre corto del mes
 */
export const getMesNombreCorto = (m) => {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return meses[m - 1] || '';
};

/**
 * Formatea un número con separadores de miles
 * @param {number} num - Número a formatear
 * @returns {string} Número formateado
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('es-CL').format(num || 0);
};

/**
 * Calcula los días restantes entre hoy y una fecha futura
 * @param {string} fecha - Fecha objetivo
 * @returns {number} Días restantes
 */
export const calcularDiasRestantes = (fecha) => {
  if (!fecha) return 0;
  const hoy = new Date();
  const fechaObjetivo = new Date(fecha);
  const diferencia = fechaObjetivo - hoy;
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
};

/**
 * Convierte un tipo de contrato a texto legible
 * @param {string} tipo - Tipo de contrato
 * @returns {string} Texto formateado
 */
export const formatTipoContrato = (tipo) => {
  const tipos = {
    'indefinido': 'Indefinido',
    'plazo_fijo': 'Plazo Fijo',
    'practicante': 'Practicante'
  };
  return tipos[tipo] || tipo;
};

/**
 * Convierte un tipo de mantenimiento a texto legible
 * @param {string} tipo - Tipo de mantenimiento
 * @returns {string} Texto formateado
 */
export const formatTipoMantenimiento = (tipo) => {
  const tipos = {
    'preventivo': 'Preventivo',
    'correctivo': 'Correctivo',
    'revision': 'Revisión Técnica'
  };
  return tipos[tipo] || tipo;
};

/**
 * Convierte un estado a texto legible
 * @param {string} estado - Estado
 * @returns {string} Texto formateado
 */
export const formatEstado = (estado) => {
  const estados = {
    'activo': 'Activo',
    'inactivo': 'Inactivo',
    'licencia': 'En Licencia',
    'suspendido': 'Suspendido',
    'terminado': 'Terminado',
    'en_proceso': 'En Proceso',
    'completado': 'Completado',
    'cancelado': 'Cancelado',
    'solicitado': 'Solicitado',
    'aprobado': 'Aprobado',
    'rechazado': 'Rechazado'
  };
  return estados[estado] || estado;
};

/**
 * Formatea un RUT chileno
 * @param {string} rut - RUT sin formato
 * @returns {string} RUT formateado (XX.XXX.XXX-X)
 */
export const formatRut = (rut) => {
  if (!rut) return '';
  // Eliminar puntos y guiones
  const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
  // Separar número y dígito verificador
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);
  // Formatear con puntos
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
};

/**
 * Genera un objeto de parámetros de filtro limpio (sin valores null/undefined)
 * @param {object} filtros - Objeto con filtros
 * @returns {object} Objeto limpio con solo filtros válidos
 */
export const buildFilterParams = (filtros) => {
  const params = {};

  Object.keys(filtros).forEach(key => {
    const value = filtros[key];
    if (value !== null && value !== undefined && value !== '') {
      params[key] = value;
    }
  });

  return params;
};

/**
 * Formatea una fecha a formato YYYY-MM-DD para envío al backend
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const toBackendDate = (fecha) => {
  if (!fecha) return null;
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};