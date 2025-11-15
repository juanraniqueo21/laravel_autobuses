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
export const fetchViajes = async () => {
  const response = await fetch(`${API_URL}/viajes`, fetchOptions('GET'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const createViaje = async (viajeData) => {
  const response = await fetch(`${API_URL}/viajes`, fetchOptions('POST', viajeData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateViaje = async (id, viajeData) => {
  const response = await fetch(`${API_URL}/viajes/${id}`, fetchOptions('PUT', viajeData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const deleteViaje = async (id) => {
  const response = await fetch(`${API_URL}/viajes/${id}`, fetchOptions('DELETE'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
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