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

// ============================================
// ROLES
// ============================================
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

// ============================================
// USUARIOS
// ============================================
export const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/users`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const createUser = async (userData) => {
  const response = await fetch(`${API_URL}/users`, fetchOptions('POST', userData));
  
  let data;
  try {
    data = await response.json();
  } catch (error) {
    const text = await response.text();
    console.error('❌ Respuesta del servidor (HTML):', text);
    throw new Error('Error del servidor. Revisa la consola del navegador.');
  }

  if (!response.ok) {
    const errorMsg = data.error || data.message || `HTTP error! status: ${response.status}`;
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

// ============================================
// EMPLEADOS
// ============================================
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
  const response = await fetch(`${API_URL}/empleados/${id}/baja`, fetchOptions('POST', data));
  const responseText = await response.text();

  if (!response.ok) {
    try {
      const errorData = JSON.parse(responseText);
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    } catch (e) {
      throw new Error(`Error del servidor (${response.status}).`);
    }
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error('Respuesta del servidor no es JSON válido');
  }
};

// ============================================
// CONDUCTORES (Gestión Admin)
// ============================================
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

// ============================================
// BUSES
// ============================================
export const fetchBuses = async () => {
  const response = await fetch(`${API_URL}/buses`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  if (data.success && data.data) return data.data;
  return data;
};

export const createBus = async (busData) => {
  const response = await fetch(`${API_URL}/buses`, fetchOptions('POST', busData));
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);
  return data.data || data;
};

export const updateBus = async (id, busData) => {
  const response = await fetch(`${API_URL}/buses/${id}`, fetchOptions('PUT', busData));
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);
  return data.data || data;
};

export const deleteBus = async (id) => {
  const response = await fetch(`${API_URL}/buses/${id}`, fetchOptions('DELETE'));
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);
  return data;
};

// ============================================
// RUTAS
// ============================================
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

export const fetchRutaById = async (id) => {
  const response = await fetch(`${API_URL}/rutas/${id}`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const guardarParadasRuta = async (rutaId, data) => {
  const response = await fetch(`${API_URL}/rutas/${rutaId}/paradas/guardar`, fetchOptions('POST', data));
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// ============================================
// ASISTENTES (Gestión Admin)
// ============================================
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

// ============================================
// VIAJES (Gestión)
// ============================================
export const fetchViajes = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) queryParams.append(key, filters[key]);
  });

  const url = `${API_URL}/viajes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const fetchViajesActivos = async () => {
  const response = await fetch(`${API_URL}/viajes/activos`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const fetchViajesPorTurno = async (turnoId) => {
  const response = await fetch(`${API_URL}/viajes/turno/${turnoId}`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const fetchViajeById = async (id) => {
  const response = await fetch(`${API_URL}/viajes/${id}`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const createViaje = async (viajeData) => {
  const response = await fetch(`${API_URL}/viajes`, fetchOptions('POST', viajeData));
  const data = await response.json();
  if (!response.ok) {
    if (data.errors) throw new Error(Object.values(data.errors).flat().join(', '));
    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
  }
  return data;
};

export const updateViaje = async (id, viajeData) => {
  const response = await fetch(`${API_URL}/viajes/${id}`, fetchOptions('PUT', viajeData));
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
  }
  return data;
};

export const finalizarViaje = async (id, data) => {
  const response = await fetch(`${API_URL}/viajes/${id}/finalizar`, fetchOptions('POST', data));
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.error || responseData.message || `HTTP error! status: ${response.status}`);
  }
  return responseData;
};

export const cancelarViaje = async (id, motivo) => {
  const response = await fetch(`${API_URL}/viajes/${id}/cancelar`, fetchOptions('POST', { motivo }));
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
  }
  return data;
};

export const deleteViaje = async (id) => {
  const response = await fetch(`${API_URL}/viajes/${id}`, fetchOptions('DELETE'));
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
  }
  return data;
};

// ============================================
// MECANICOS
// ============================================
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

// ============================================
// MANTENIMIENTOS
// ============================================
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

// ============================================
// AFP / ISAPRE
// ============================================
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

// ============================================
// TURNOS / ROTATIVAS (Gestión Admin)
// ============================================
export const fetchTurnos = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) queryParams.append(key, filters[key]);
  });

  const url = `${API_URL}/turnos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return data.success ? data.data : data;
};

export const fetchTurno = async (id) => {
  const response = await fetch(`${API_URL}/turnos/${id}`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return data.success ? data.data : data;
};

export const createTurno = async (turnoData) => {
  const response = await fetch(`${API_URL}/turnos`, fetchOptions('POST', turnoData));
  const data = await response.json();
  if (!response.ok) {
    if (data.errors) throw new Error(Object.values(data.errors).flat().join(', '));
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  return data.success ? data.data : data;
};

export const updateTurno = async (id, turnoData) => {
  const response = await fetch(`${API_URL}/turnos/${id}`, fetchOptions('PUT', turnoData));
  const data = await response.json();
  if (!response.ok) {
    if (data.errors) throw new Error(Object.values(data.errors).flat().join(', '));
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  return data.success ? data.data : data;
};

export const deleteTurno = async (id) => {
  const response = await fetch(`${API_URL}/turnos/${id}`, fetchOptions('DELETE'));
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);
  return data;
};

export const fetchCalendarioTurnos = async (anio, mes) => {
  const response = await fetch(`${API_URL}/turnos/calendario/${anio}/${mes}`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return data.success ? data.data : data;
};

// ============================================
// PANEL CONDUCTOR
// ============================================

/**
 * Obtener dashboard del conductor autenticado
 */
export const fetchConductorDashboard = async () => {
  const response = await fetch(`${API_URL}/conductor/dashboard`, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener turnos del conductor autenticado
 */
export const fetchMisTurnos = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });

  const url = `${API_URL}/conductor/mis-turnos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener detalle de un turno específico del conductor
 */
export const fetchMiTurno = async (id) => {
  const response = await fetch(`${API_URL}/conductor/mis-turnos/${id}`, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener viajes del conductor autenticado
 */
export const fetchMisViajes = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });

  const url = `${API_URL}/conductor/mis-viajes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener detalle de un viaje específico del conductor
 */
export const fetchMiViaje = async (id) => {
  const response = await fetch(`${API_URL}/conductor/mis-viajes/${id}`, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.success ? data.data : data;
};

// ============================================
// PANEL ASISTENTE
// ============================================

/**
 * Obtener dashboard del asistente autenticado
 */
export const fetchAsistenteDashboard = async () => {
  const response = await fetch(`${API_URL}/asistente/dashboard`, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener turnos del asistente autenticado
 */
export const fetchMisTurnosAsistente = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });

  const url = `${API_URL}/asistente/mis-turnos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener detalle de un turno específico del asistente
 */
export const fetchMiTurnoAsistente = async (id) => {
  const response = await fetch(`${API_URL}/asistente/mis-turnos/${id}`, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener viajes del asistente autenticado
 */
export const fetchMisViajesAsistente = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });

  const url = `${API_URL}/asistente/mis-viajes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener detalle de un viaje específico del asistente
 */
export const fetchMiViajeAsistente = async (id) => {
  const response = await fetch(`${API_URL}/asistente/mis-viajes/${id}`, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.success ? data.data : data;
};