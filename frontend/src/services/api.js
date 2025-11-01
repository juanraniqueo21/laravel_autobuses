import { Key } from "lucide-react";

const API_URL = '/api';

const fetchOptions = (method = 'GET', body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return options;
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

export const createUser = async (userData) => {
  const response = await fetch(`${API_URL}/users`, fetchOptions('POST', userData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
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
  return response.json();
};

export const createBus = async (busData) => {
  const response = await fetch(`${API_URL}/buses`, fetchOptions('POST', busData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const updateBus = async (id, busData) => {
  const response = await fetch(`${API_URL}/buses/${id}`, fetchOptions('PUT', busData));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const deleteBus = async (id) => {
  const response = await fetch(`${API_URL}/buses/${id}`, fetchOptions('DELETE'));
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
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
