const API_URL = '/api';

// ============================================
// HELPER: Obtener token del localStorage
// ============================================
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// ============================================
// HELPER: Configurar headers con token JWT
// ============================================
const fetchOptions = (method = 'GET', body = null, requiresAuth = true) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Agregar token JWT si la petición requiere autenticación
  if (requiresAuth) {
    const token = getAuthToken();
    console.log('🔑 Token en fetchOptions:', token);
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return options;
};

// ============================================
// AUTENTICACIÓN (AUTH)
// ============================================

/**
 * LOGIN - Autenticar usuario
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise} { success, token, user }
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, fetchOptions('POST', { email, password }, false));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en el login');
  }
  const data = await response.json();
  
  // Guardar token en localStorage
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
};

/**
 * LOGOUT - Cerrar sesión
 */
export const logout = async () => {
  try {
    await fetch(`${API_URL}/logout`, fetchOptions('POST', null, true));
  } catch (error) {
    console.error('Error en logout:', error);
  } finally {
    // Limpiar localStorage siempre
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * ME - Obtener datos del usuario autenticado
 */
export const me = async () => {
  const response = await fetch(`${API_URL}/me`, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('No autenticado');
  return response.json();
};

/**
 * REFRESH - Renovar token JWT
 */
export const refreshToken = async () => {
  const response = await fetch(`${API_URL}/refresh`, fetchOptions('POST', null, true));
  if (!response.ok) throw new Error('No se pudo renovar el token');
  const data = await response.json();
  
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  
  return data;
};

// ========== ROLES ==========
export const fetchRoles = async () => {
  const response = await fetch(`${API_URL}/roles`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const createRole = async (roleData) => {
  const response = await fetch(`${API_URL}/roles`, fetchOptions('POST', roleData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateRole = async (id, roleData) => {
  const response = await fetch(`${API_URL}/roles/${id}`, fetchOptions('PUT', roleData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const deleteRole = async (id) => {
  const response = await fetch(`${API_URL}/roles/${id}`, fetchOptions('DELETE'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ========== USUARIOS ==========
export const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/users`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// Reemplaza la función createUser en tu api.js con esta versión:

export const createUser = async (userData) => {
  const response = await fetch(`${API_URL}/users`, fetchOptions('POST', userData));
  
  // Intentar parsear la respuesta como JSON
  let data;
  try {
    data = await response.json();
  } catch (error) {
    // Si no es JSON, probablemente es un error HTML de Laravel
    const text = await response.text();
    console.error('❌ Respuesta del servidor (HTML):', text);
    throw new Error('Error del servidor. Revisa la consola del navegador para más detalles.');
  }
  
  if (!response.ok) {
    // Si hay errores de validación o mensaje de error
    const errorMsg = data.error || data.message || `HTTP error! status: ${response.status}`;
    console.error('❌ Error del backend:', data);
    throw new Error(errorMsg);
  }
  
  return data;
};

export const updateUser = async (id, userData) => {
  const response = await fetch(`${API_URL}/users/${id}`, fetchOptions('PUT', userData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const deleteUser = async (id) => {
  const response = await fetch(`${API_URL}/users/${id}`, fetchOptions('DELETE'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ========== EMPLEADOS ==========
export const fetchEmpleados = async () => {
  const response = await fetch(`${API_URL}/empleados`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const createEmpleado = async (empleadoData) => {
  const response = await fetch(`${API_URL}/empleados`, fetchOptions('POST', empleadoData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateEmpleado = async (id, empleadoData) => {
  const response = await fetch(`${API_URL}/empleados/${id}`, fetchOptions('PUT', empleadoData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const deleteEmpleado = async (id) => {
  const response = await fetch(`${API_URL}/empleados/${id}`, fetchOptions('DELETE'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};
export const darDeBajaEmpleado = async (id, data) => {
  console.log('🌐 URL:', `${API_URL}/empleados/${id}/baja`);
  console.log('📤 Datos enviados:', data);
  
  const response = await fetch(`${API_URL}/empleados/${id}/baja`, fetchOptions('POST', data));
  
  console.log('📥 Response status:', response.status);
  console.log('📥 Response OK?:', response.ok);
  
  // Leer la respuesta como texto primero
  const responseText = await response.text();
  console.log('📥 Response text (primeros 500 chars):', responseText.substring(0, 500));
  
  if (!response.ok) {
    // Intentar parsear como JSON
    try {
      const errorData = JSON.parse(responseText);
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    } catch (e) {
      // Si no es JSON, es HTML (error 500 de Laravel)
      console.error('❌ Respuesta no es JSON, es HTML/texto');
      console.error('Contenido:', responseText.substring(0, 1000));
      throw new Error(`Error del servidor (${response.status}). Revisa los logs del backend.`);
    }
  }
  
  // Si response.ok, parsear como JSON
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error('❌ Error parseando respuesta exitosa:', e);
    throw new Error('Respuesta del servidor no es JSON válido');
  }
};
  

// ========== CONDUCTORES ==========
export const fetchConductores = async () => {
  const response = await fetch(`${API_URL}/conductores`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const createConductor = async (conductorData) => {
  const response = await fetch(`${API_URL}/conductores`, fetchOptions('POST', conductorData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateConductor = async (id, conductorData) => {
  const response = await fetch(`${API_URL}/conductores/${id}`, fetchOptions('PUT', conductorData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const deleteConductor = async (id) => {
  const response = await fetch(`${API_URL}/conductores/${id}`, fetchOptions('DELETE'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ========== BUSES ==========
export const fetchBuses = async () => {
  const response = await fetch(`${API_URL}/buses`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  
  // El backend devuelve {success: true, data: [...]}
  if (data.success && data.data) {
    return data.data;
  }
  return data;
};

export const createBus = async (busData) => {
  const response = await fetch(`${API_URL}/buses`, fetchOptions('POST', busData));
  const data = await response.json();
  
  if (!response.ok) {
    // Si hay errores de validación, lanzarlos
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  // El backend devuelve {success: true, data: {...}}
  return data.data || data;
};

export const updateBus = async (id, busData) => {
  const response = await fetch(`${API_URL}/buses/${id}`, fetchOptions('PUT', busData));
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data.data || data;
};

export const deleteBus = async (id) => {
  const response = await fetch(`${API_URL}/buses/${id}`, fetchOptions('DELETE'));
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

// ========== RUTAS ==========
export const fetchRutas = async () => {
  const response = await fetch(`${API_URL}/rutas`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const createRuta = async (rutaData) => {
  const response = await fetch(`${API_URL}/rutas`, fetchOptions('POST', rutaData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateRuta = async (id, rutaData) => {
  const response = await fetch(`${API_URL}/rutas/${id}`, fetchOptions('PUT', rutaData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const deleteRuta = async (id) => {
  const response = await fetch(`${API_URL}/rutas/${id}`, fetchOptions('DELETE'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};
// rutas detalles y gestion
export const fetchRutaById = async (id) => {
  const response = await fetch(`${API_URL}/rutas/${id}`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

/**
 * Guardar las paradas de una ruta
 * @param {number} rutaId - ID de la ruta
 * @param {Object} data - { paradas: [{ciudad, orden, distancia_desde_anterior_km, tiempo_desde_anterior_min}] }
 */
export const guardarParadasRuta = async (rutaId, data) => {
  const response = await fetch(`${API_URL}/rutas/${rutaId}/paradas/guardar`, fetchOptions('POST', data));
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Guardar las tarifas de una ruta
 * @param {number} rutaId - ID de la ruta
 * @param {Object} data - { tarifas: [{tipo_pasajero, tarifa}] }
 */


// ========== ASISTENTES ==========
export const fetchAsistentes = async () => {
  const response = await fetch(`${API_URL}/asistentes`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const createAsistente = async (asistenteData) => {
  const response = await fetch(`${API_URL}/asistentes`, fetchOptions('POST', asistenteData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateAsistente = async (id, asistenteData) => {
  const response = await fetch(`${API_URL}/asistentes/${id}`, fetchOptions('PUT', asistenteData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const deleteAsistente = async (id) => {
  const response = await fetch(`${API_URL}/asistentes/${id}`, fetchOptions('DELETE'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ========== VIAJES ==========

/**
 * Obtener todos los viajes con filtros opcionales
 * @param {Object} filters - { turno_id, fecha, ruta_id, estado }
 */
export const fetchViajes = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) {
      queryParams.append(key, filters[key]);
    }
  });
  
  const url = `${API_URL}/viajes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET'));
  
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

/**
 * Obtener viajes activos (en curso)
 */
export const fetchViajesActivos = async () => {
  const response = await fetch(`${API_URL}/viajes/activos`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

/**
 * Obtener viajes de un turno específico
 */
export const fetchViajesPorTurno = async (turnoId) => {
  const response = await fetch(`${API_URL}/viajes/turno/${turnoId}`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

/**
 * Obtener un viaje específico por ID
 */
export const fetchViajeById = async (id) => {
  const response = await fetch(`${API_URL}/viajes/${id}`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

/**
 * Crear un nuevo viaje
 * @param {Object} viajeData - { asignacion_turno_id, ruta_id, fecha_hora_salida, observaciones }
 */
export const createViaje = async (viajeData) => {
  const response = await fetch(`${API_URL}/viajes`, fetchOptions('POST', viajeData));
  
  const data = await response.json();
  
  if (!response.ok) {
    if (data.errors) {
      const errorMessages = Object.values(data.errors).flat().join(', ');
      throw new Error(errorMessages);
    }
    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Actualizar un viaje existente
 */
export const updateViaje = async (id, viajeData) => {
  const response = await fetch(`${API_URL}/viajes/${id}`, fetchOptions('PUT', viajeData));
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Finalizar un viaje (registrar hora de llegada)
 * @param {number} id - ID del viaje
 * @param {Object} data - { fecha_hora_llegada, observaciones }
 */
export const finalizarViaje = async (id, data) => {
  const response = await fetch(`${API_URL}/viajes/${id}/finalizar`, fetchOptions('POST', data));
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(responseData.error || responseData.message || `HTTP error! status: ${response.status}`);
  }
  
  return responseData;
};

/**
 * Cancelar un viaje
 * @param {number} id - ID del viaje
 * @param {string} motivo - Motivo de la cancelación
 */
export const cancelarViaje = async (id, motivo) => {
  const response = await fetch(`${API_URL}/viajes/${id}/cancelar`, fetchOptions('POST', { motivo }));
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Eliminar un viaje
 */
export const deleteViaje = async (id) => {
  const response = await fetch(`${API_URL}/viajes/${id}`, fetchOptions('DELETE'));
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

// ========== MECANICOS ==========
export const fetchMecanicos = async () => {
  const response = await fetch(`${API_URL}/mecanicos`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const createMecanico = async (mecanicoData) => {
  const response = await fetch(`${API_URL}/mecanicos`, fetchOptions('POST', mecanicoData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateMecanico = async (id, mecanicoData) => {
  const response = await fetch(`${API_URL}/mecanicos/${id}`, fetchOptions('PUT', mecanicoData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const deleteMecanico = async (id) => {
  const response = await fetch(`${API_URL}/mecanicos/${id}`, fetchOptions('DELETE'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ========== MANTENIMIENTOS ==========
export const fetchMantenimientos = async () => {
  const response = await fetch(`${API_URL}/mantenimientos`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const createMantenimiento = async (mantenimientoData) => {
  const response = await fetch(`${API_URL}/mantenimientos`, fetchOptions('POST', mantenimientoData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateMantenimiento = async (id, mantenimientoData) => {
  const response = await fetch(`${API_URL}/mantenimientos/${id}`, fetchOptions('PUT', mantenimientoData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const deleteMantenimiento = async (id) => {
  const response = await fetch(`${API_URL}/mantenimientos/${id}`, fetchOptions('DELETE'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ========== AFP/ISAPRE ==========
export const fetchAfps = async () => {
  const response = await fetch(`${API_URL}/empleados/afps`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const fetchIsapres = async () => {
  const response = await fetch(`${API_URL}/empleados/isapres`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ========== TURNOS / ROTATIVAS ==========

/**
 * Obtener todos los turnos con filtros opcionales
 * @param {Object} filters - { fecha, fecha_inicio, fecha_fin, tipo_turno, estado, conductor_id, bus_id }
 */
export const fetchTurnos = async (filters = {}) => {
  // Construir query string con filtros
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) {
      queryParams.append(key, filters[key]);
    }
  });
  
  const url = `${API_URL}/turnos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET'));
  
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener un turno específico por ID
 */
export const fetchTurno = async (id) => {
  const response = await fetch(`${API_URL}/turnos/${id}`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Crear un nuevo turno
 * @param {Object} turnoData - { bus_id, fecha_turno, hora_inicio, hora_termino, tipo_turno, conductores: [{conductor_id, rol}], asistentes: [{asistente_id, posicion}] }
 */
export const createTurno = async (turnoData) => {
  const response = await fetch(`${API_URL}/turnos`, fetchOptions('POST', turnoData));
  
  const data = await response.json();
  
  if (!response.ok) {
    // Manejar errores de validación
    if (data.errors) {
      const errorMessages = Object.values(data.errors).flat().join(', ');
      throw new Error(errorMessages);
    }
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data.success ? data.data : data;
};

/**
 * Actualizar un turno existente
 */
export const updateTurno = async (id, turnoData) => {
  const response = await fetch(`${API_URL}/turnos/${id}`, fetchOptions('PUT', turnoData));
  
  const data = await response.json();
  
  if (!response.ok) {
    if (data.errors) {
      const errorMessages = Object.values(data.errors).flat().join(', ');
      throw new Error(errorMessages);
    }
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data.success ? data.data : data;
};

/**
 * Eliminar un turno
 */
export const deleteTurno = async (id) => {
  const response = await fetch(`${API_URL}/turnos/${id}`, fetchOptions('DELETE'));
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Obtener calendario de turnos de un mes específico
 * @param {number} anio - Año (ej: 2024)
 * @param {number} mes - Mes (1-12)
 */
export const fetchCalendarioTurnos = async (anio, mes) => {
  const response = await fetch(`${API_URL}/turnos/calendario/${anio}/${mes}`, fetchOptions('GET'));
  
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
  const data = await response.json();
  return data.success ? data.data : data;
};