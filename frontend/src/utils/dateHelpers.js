/**
 * Helpers para manejo de fechas en la aplicación
 * Ubicación: frontend/src/utils/dateHelpers.js
 */

/**
 * Formatea una fecha en formato YYYY-MM-DD a texto legible
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada (ej: "lun, 27 nov")
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    // Dividir la fecha y crear objeto Date sin conversión de zona horaria
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('es-CL', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  } catch (error) {
    console.error('Error formateando fecha:', dateString, error);
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha completa con año
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada (ej: "lunes, 27 de noviembre de 2025")
 */
export const formatDateLong = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('es-CL', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  } catch (error) {
    console.error('Error formateando fecha larga:', dateString, error);
    return 'Fecha inválida';
  }
};

/**
 * Extrae la hora de un timestamp ISO 8601 o de una hora TIME
 * @param {string} timeString - Hora en formato HH:MM:SS o ISO 8601
 * @returns {string} Hora en formato HH:MM
 */
export const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    // Si es solo hora (HH:MM:SS)
    if (timeString.includes(':') && !timeString.includes('T')) {
      return timeString.substring(0, 5);
    }
    
    // Si es timestamp ISO completo (YYYY-MM-DDTHH:MM:SS)
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    }
    
    return timeString.substring(0, 5);
  } catch (error) {
    console.error('Error formateando hora:', timeString, error);
    return '';
  }
};

/**
 * Convierte una fecha y hora local a formato ISO para enviar al backend
 * @param {string} datetimeLocal - Datetime en formato "YYYY-MM-DDTHH:MM"
 * @returns {string} Fecha en formato ISO compatible con Laravel
 */
export const toBackendDatetime = (datetimeLocal) => {
  if (!datetimeLocal) return null;
  
  // Agregar segundos si no los tiene
  if (datetimeLocal.length === 16) {
    return datetimeLocal + ':00';
  }
  
  return datetimeLocal;
};

/**
 * Convierte un timestamp del backend a formato datetime-local para inputs
 * @param {string} backendDatetime - Fecha del backend (YYYY-MM-DD HH:MM:SS)
 * @returns {string} Formato datetime-local (YYYY-MM-DDTHH:MM)
 */
export const toDatetimeLocal = (backendDatetime) => {
  if (!backendDatetime) return '';
  
  try {
    // Si ya tiene T, reemplazar espacio por T
    const formatted = backendDatetime.replace(' ', 'T');
    // Tomar solo hasta los minutos
    return formatted.substring(0, 16);
  } catch (error) {
    console.error('Error convirtiendo a datetime-local:', backendDatetime, error);
    return '';
  }
};

/**
 * Verifica si una fecha es hoy
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {boolean}
 */
export const isToday = (dateString) => {
  if (!dateString) return false;
  
  try {
    const today = new Date();
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * @returns {string}
 */
export const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene la fecha y hora actual en formato datetime-local
 * @returns {string} Formato YYYY-MM-DDTHH:MM
 */
export const getNowDatetimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};