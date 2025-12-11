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

// ============================================
// LICENCIAS MÉDICAS Y PERMISOS
// ============================================

/**
 * Obtener todas las licencias (Admin, Manager, RRHH)
 */
export const fetchLicencias = async (filtros = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(filtros).forEach(key => {
    if (filtros[key] !== undefined && filtros[key] !== null && filtros[key] !== '') {
      queryParams.append(key, filtros[key]);
    }
  });

  const url = `${API_URL}/licencias${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Obtener mis licencias (Conductor)
 */
export const fetchMisLicencias = async () => {
  const response = await fetch(`${API_URL}/licencias/mis-licencias`, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Obtener una licencia específica
 */
export const fetchLicencia = async (id) => {
  const response = await fetch(`${API_URL}/licencias/${id}`, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Crear nueva licencia (con soporte para FormData)
 */
export const crearLicencia = async (formData) => {
  const token = getAuthToken();
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // NO incluir Content-Type para FormData, el navegador lo configura automáticamente
    },
    body: formData, // FormData directamente
  };

  const response = await fetch(`${API_URL}/licencias`, options);
  const data = await response.json();
  
  if (!response.ok) {
    if (data.errors) {
      throw new Error(Object.values(data.errors).flat().join(', '));
    }
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Actualizar licencia (con soporte para FormData)
 */
export const actualizarLicencia = async (id, formData) => {
  const token = getAuthToken();
  
  // Para PUT con FormData, necesitamos usar _method
  formData.append('_method', 'PUT');
  
  const options = {
    method: 'POST', // Laravel acepta POST con _method=PUT
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  };

  const response = await fetch(`${API_URL}/licencias/${id}`, options);
  const data = await response.json();
  
  if (!response.ok) {
    if (data.errors) {
      throw new Error(Object.values(data.errors).flat().join(', '));
    }
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Aprobar licencia
 */
export const aprobarLicencia = async (id) => {
  const response = await fetch(`${API_URL}/licencias/${id}/aprobar`, fetchOptions('POST'));
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Rechazar licencia
 */
export const rechazarLicencia = async (id, motivoRechazo) => {
  const response = await fetch(
    `${API_URL}/licencias/${id}/rechazar`, 
    fetchOptions('POST', { motivo_rechazo: motivoRechazo })
  );
  const data = await response.json();
  
  if (!response.ok) {
    if (data.errors) {
      throw new Error(Object.values(data.errors).flat().join(', '));
    }
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Eliminar licencia
 */
export const eliminarLicencia = async (id) => {
  const response = await fetch(`${API_URL}/licencias/${id}`, fetchOptions('DELETE'));
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Descargar PDF de licencia
 */
export const descargarPdfLicencia = async (id) => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/licencias/${id}/descargar-pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Descargar el archivo
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `licencia_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// =============================================
// LIQUIDACIONES
// =============================================

export const fetchLiquidaciones = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.empleado_id) params.append('empleado_id', filtros.empleado_id);
  if (filtros.estado) params.append('estado', filtros.estado);
  if (filtros.anio) params.append('anio', filtros.anio);
  if (filtros.mes) params.append('mes', filtros.mes);
  
  const url = `/liquidaciones${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(`${API_URL}${url}`, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener liquidaciones');
  return response.json();
};

export const fetchEstadisticasLiquidaciones = async () => {
  const response = await fetch(`${API_URL}/liquidaciones/estadisticas`, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener estadísticas');
  return response.json();
};

export const createLiquidacion = async (data) => {
  const response = await fetch(`${API_URL}/liquidaciones`, fetchOptions('POST', data, true));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear liquidación');
  }
  return response.json();
};

export const updateLiquidacion = async (id, data) => {
  const response = await fetch(`${API_URL}/liquidaciones/${id}`, fetchOptions('PUT', data, true));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar liquidación');
  }
  return response.json();
};

export const deleteLiquidacion = async (id) => {
  const response = await fetch(`${API_URL}/liquidaciones/${id}`, fetchOptions('DELETE', null, true));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar liquidación');
  }
  return response.json();
};

export const calcularLiquidacion = async (empleadoId, periodoDesde, periodoHasta) => {
  const response = await fetch(`${API_URL}/liquidaciones/calcular`, fetchOptions('POST', {
    empleado_id: empleadoId,
    periodo_desde: periodoDesde,
    periodo_hasta: periodoHasta
  }, true));
  
  if (!response.ok) throw new Error('Error al calcular liquidación');
  return response.json();
};

export const descargarLiquidacionPDF = async (id) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/liquidaciones/${id}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Error al descargar PDF');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liquidacion_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
  
};

// ============================================
// REPORTS / LOGÍSTICA
// ============================================

/**
 * Obtener estadísticas generales de logística
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 */
export const fetchEstadisticasLogistica = async (mes = null, anio = null) => {
  const params = new URLSearchParams();
  if (mes) params.append('mes', mes);
  if (anio) params.append('anio', anio);

  const url = `${API_URL}/reports/logistica${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener estadísticas de logística');
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener datos para gráfico de viajes por día
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 */
export const fetchViajesPorDia = async (mes = null, anio = null) => {
  const params = new URLSearchParams();
  if (mes) params.append('mes', mes);
  if (anio) params.append('anio', anio);

  const url = `${API_URL}/reports/viajes-por-dia${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener viajes por día');
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener datos para gráfico de estado de buses
 */
export const fetchEstadoBuses = async () => {
  const response = await fetch(`${API_URL}/reports/estado-buses`, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener estado de buses');
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener datos para gráfico de rutas más activas
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 */
export const fetchRutasActivas = async (mes = null, anio = null) => {
  const params = new URLSearchParams();
  if (mes) params.append('mes', mes);
  if (anio) params.append('anio', anio);

  const url = `${API_URL}/reports/rutas-activas${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener rutas activas');
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Obtener datos para gráfico de ocupación de buses
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 */
export const fetchOcupacionBuses = async (mes = null, anio = null) => {
  const params = new URLSearchParams();
  if (mes) params.append('mes', mes);
  if (anio) params.append('anio', anio);

  const url = `${API_URL}/reports/ocupacion-buses${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET', null, true));
  if (!response.ok) throw new Error('Error al obtener ocupación de buses');
  const data = await response.json();
  return data.success ? data.data : data;
};

/**
 * Descargar reporte mensual en PDF
 * @param {number} mes - Mes (1-12)
 * @param {number} anio - Año
 */
export const descargarReportePDF = async (mes, anio) => {
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

// ============================================
// PANEL MECANICO (Vista Personal)
// ============================================

/**
 * Obtener dashboard del mecánico autenticado
 */
export const fetchMecanicoDashboard = async () => {
  const response = await fetch(`${API_URL}/mecanico/dashboard`, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  // Retornamos data.data si success es true
  return data.success ? data.data : data;
};

/**
 * Obtener mantenciones asignadas al mecánico
 */
export const fetchMisMantenciones = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) queryParams.append(key, filters[key]);
  });

  const url = `${API_URL}/mecanico/mis-mantenciones${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET'));
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.success ? data.data : data;
};

// ============================================
// REPORTES (NUEVO MÓDULO)
// ============================================

/**
 * Obtener todos los reportes (Admin/RRHH ven todos, otros ven los suyos)
 */
export const fetchReportes = async (filtros = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(filtros).forEach(key => {
    if (filtros[key] !== undefined && filtros[key] !== null && filtros[key] !== '') {
      queryParams.append(key, filtros[key]);
    }
  });

  const url = `${API_URL}/reportes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Obtener mis reportes (usuario autenticado)
 */
export const fetchMisReportes = async () => {
  const response = await fetch(`${API_URL}/reportes/mis-reportes`, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Obtener un reporte específico
 */
export const fetchReporte = async (id) => {
  const response = await fetch(`${API_URL}/reportes/${id}`, fetchOptions('GET'));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Crear nuevo reporte (con soporte para FormData)
 */
export const crearReporte = async (formData) => {
  const token = getAuthToken();
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // NO incluir Content-Type para FormData
    },
    body: formData,
  };

  const response = await fetch(`${API_URL}/reportes`, options);
  const data = await response.json();
  
  if (!response.ok) {
    if (data.errors) {
      throw new Error(Object.values(data.errors).flat().join(', '));
    }
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Actualizar reporte (con soporte para FormData)
 */
export const actualizarReporte = async (id, formData) => {
  const token = getAuthToken();
  
  // Para PUT con FormData, necesitamos usar _method
  formData.append('_method', 'PUT');
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  };

  const response = await fetch(`${API_URL}/reportes/${id}`, options);
  const data = await response.json();
  
  if (!response.ok) {
    if (data.errors) {
      throw new Error(Object.values(data.errors).flat().join(', '));
    }
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Aprobar reporte
 */
export const aprobarReporte = async (id, observaciones = '') => {
  const response = await fetch(
    `${API_URL}/reportes/${id}/aprobar`, 
    fetchOptions('POST', { observaciones_revision: observaciones })
  );
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Rechazar reporte
 */
export const rechazarReporte = async (id, observaciones) => {
  const response = await fetch(
    `${API_URL}/reportes/${id}/rechazar`, 
    fetchOptions('POST', { observaciones_revision: observaciones })
  );
  const data = await response.json();
  
  if (!response.ok) {
    if (data.errors) {
      throw new Error(Object.values(data.errors).flat().join(', '));
    }
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Eliminar reporte
 */
export const eliminarReporte = async (id) => {
  const response = await fetch(`${API_URL}/reportes/${id}`, fetchOptions('DELETE'));
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

/**
 * Descargar documento adjunto de reporte
 */
export const descargarDocumentoReporte = async (id) => {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}/reportes/${id}/descargar-documento`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Descargar el archivo
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_documento_${id}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// ============================================
// ANÁLISIS Y BI - TIPOS DE SERVICIO
// ============================================

/**
 * Obtener análisis de rentabilidad por tipo de servicio
 */
export const fetchRentabilidadPorTipoServicio = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
  if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);

  const url = `${API_URL}/reportes/rentabilidad-por-tipo-servicio?${queryParams.toString()}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Obtener análisis de ocupación por tipo de servicio
 */
export const fetchOcupacionPorTipoServicio = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
  if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);

  const url = `${API_URL}/reportes/ocupacion-por-tipo-servicio?${queryParams.toString()}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Obtener resumen ejecutivo
 */
export const fetchResumenEjecutivo = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
  if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);

  const url = `${API_URL}/reportes/resumen-ejecutivo?${queryParams.toString()}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

// ============================================
// ANÁLISIS DE MANTENIMIENTOS
// ============================================

/**
 * Obtener buses con más mantenimientos
 */
export const fetchBusesConMasMantenimientos = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
  if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
  if (params.tipo_servicio) queryParams.append('tipo_servicio', params.tipo_servicio);
  if (params.limit) queryParams.append('limit', params.limit);

  const url = `${API_URL}/reportes/buses-con-mas-mantenimientos?${queryParams.toString()}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Obtener tipos de fallas más comunes
 */
export const fetchTiposFallasMasComunes = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
  if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);

  const url = `${API_URL}/reportes/tipos-fallas-mas-comunes?${queryParams.toString()}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Obtener costos de mantenimiento por bus
 */
export const fetchCostosMantenimientoPorBus = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.fecha_inicio) queryParams.append('fecha_inicio', params.fecha_inicio);
  if (params.fecha_fin) queryParams.append('fecha_fin', params.fecha_fin);
  if (params.tipo_servicio) queryParams.append('tipo_servicio', params.tipo_servicio);
  if (params.limit) queryParams.append('limit', params.limit);

  const url = `${API_URL}/reportes/costos-mantenimiento-por-bus?${queryParams.toString()}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Obtener buses disponibles para emergencia
 * @param {Object} params - Parámetros opcionales (mes, anio)
 */
export const fetchBusesDisponiblesEmergencia = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  const url = `${API_URL}/reportes/buses-disponibles-emergencia${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Dashboard operativo - Alertas categorizadas
 * @param {Object} params - Parámetros opcionales (mes, anio, fecha_inicio, fecha_fin)
 */
export const fetchDashboardOperativo = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  const url = `${API_URL}/reportes/dashboard-operativo${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Puntualidad y SLA
 * @param {Object} params - Parámetros opcionales (mes, anio, fecha_inicio, fecha_fin)
 */
export const fetchPuntualidadSLA = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  const url = `${API_URL}/reportes/puntualidad-sla${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Activar bus en emergencia (cambiar estado de mantenimiento a operativo)
 * Suspende mantenimientos en proceso y activa el bus
 */
export const activarBusEmergencia = async (busId) => {
  const url = `${API_URL}/buses/${busId}/activar-emergencia`;
  const response = await fetch(url, fetchOptions('POST', {}));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  return result;
};

// ============================================
// ALERTAS INTELIGENTES Y PREDICCIONES
// ============================================

/**
 * Obtener todas las alertas del sistema
 */
export const fetchAlertas = async () => {
  const url = `${API_URL}/alertas`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Obtener predicciones del sistema
 */
export const fetchPredicciones = async () => {
  const url = `${API_URL}/alertas/predicciones`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

// ============================================
// RECURSOS HUMANOS - ANÁLISIS Y GESTIÓN
// ============================================

/**
 * Obtener alertas de contratos próximos a vencer
 * @param {Object} params - Parámetros opcionales (mes, anio)
 */
export const fetchAlertasContratos = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  const url = `${API_URL}/rrhh/alertas-contratos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Obtener ranking de empleados por cantidad de licencias
 */
export const fetchRankingLicencias = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  const url = `${API_URL}/rrhh/ranking-licencias${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Obtener resumen de contratos por tipo
 * @param {Object} params - Parámetros opcionales (mes, anio)
 */
export const fetchResumenContratos = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  const url = `${API_URL}/rrhh/resumen-contratos${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};

/**
 * Obtener empleados con alto riesgo de no renovación
 * @param {Object} params - Parámetros opcionales (mes, anio)
 */
export const fetchEmpleadosAltoRiesgo = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  const url = `${API_URL}/rrhh/empleados-alto-riesgo${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await fetch(url, fetchOptions());
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const result = await response.json();
  return result;
};
