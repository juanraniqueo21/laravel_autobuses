import React, { useState, useEffect } from 'react';
import { Plus, Mail } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchUsers, fetchRoles, createUser, updateUser, deleteUser } from '../services/api';

const ESTADOS = ['activo', 'inactivo', 'suspendido'];

// ============================================
// UTILIDADES
// ============================================

/**
 * Formatear RUT chileno mientras se escribe
 * Entrada: 215264092 o 21526409-2
 * Salida: 21526409-2
 */
const formatRutChile = (rut) => {
  // Limpiar: solo números y K
  let cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  
  if (cleaned.length === 0) return '';
  
  // Separar número y dígito verificador
  let numero = cleaned.slice(0, -1);
  let dv = cleaned.slice(-1);
  
  // Si solo hay un carácter, no agregar guión
  if (cleaned.length === 1) return cleaned;
  
  // Formatear: 21526409-2
  return `${numero}-${dv}`;
};

/**
 * Validar formato básico de RUT
 * Solo verifica que tenga números y que el DV sea 0-9 o K
 */
const isValidRutFormat = (rut) => {
  // Limpiar
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  
  if (cleaned.length < 2) return false;
  
  // Separar
  const numero = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  // Verificar que el número sea numérico
  if (!/^\d+$/.test(numero)) return false;
  
  // Verificar que el DV sea 0-9 o K
  if (!/^[0-9K]$/.test(dv)) return false;
  
  return true;
};

/**
 * Calcular dígito verificador de RUT (Módulo 11)
 */
const calcularDVRut = (rut) => {
  // Limpiar y obtener solo el número
  const numero = rut.replace(/[^0-9]/g, '');
  
  let suma = 0;
  let multiplo = 2;
  
  // Recorrer de derecha a izquierda
  for (let i = numero.length - 1; i >= 0; i--) {
    suma += parseInt(numero[i]) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  
  const resto = suma % 11;
  const dv = 11 - resto;
  
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
};

/**
 * Validar RUT completo (formato y dígito verificador)
 */
const isValidRutComplete = (rut) => {
  if (!isValidRutFormat(rut)) return false;
  
  // Limpiar
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  const numero = cleaned.slice(0, -1);
  const dvIngresado = cleaned.slice(-1);
  
  // Calcular DV correcto
  const dvCalculado = calcularDVRut(numero);
  
  // Comparar
  return dvIngresado === dvCalculado;
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [rutError, setRutError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rut_completo: '',
    rol_id: '',
    estado: 'activo',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        fetchUsers(),
        fetchRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    setRutError('');
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        password: '',
        rut_completo: user.rut_completo || `${user.rut}-${user.rut_verificador}`,
        rol_id: user.rol_id,
        estado: user.estado,
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rut_completo: '',
        rol_id: roles.length > 0 ? roles[0].id : '',
        estado: 'activo',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setRutError('');
  };

  const handleRutChange = (e) => {
    let value = e.target.value;
    
    // Formatear automáticamente mientras escribe
    const formatted = formatRutChile(value);
    setFormData({ ...formData, rut_completo: formatted });
    
    // Validar en tiempo real
    if (formatted.length > 0) {
      if (!isValidRutFormat(formatted)) {
        setRutError('Formato inválido. Solo números y K para el verificador');
      } else if (formatted.length >= 3 && !isValidRutComplete(formatted)) {
        setRutError('RUT inválido. Dígito verificador incorrecto');
      } else {
        setRutError('');
      }
    } else {
      setRutError('');
    }
  };

  const handleSave = async () => {
    // Validar RUT antes de guardar
    if (!formData.rut_completo || !isValidRutComplete(formData.rut_completo)) {
      setRutError('RUT inválido. Verifique el formato y el dígito verificador');
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
      } else {
        await createUser(formData);
      }
      await loadData();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await deleteUser(id);
        loadData();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const getRolNombre = (rolId) => {
    const rol = roles.find(r => r.id === rolId);
    return rol ? rol.nombre : 'N/A';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'activo': 'bg-green-100 text-green-800',
      'inactivo': 'bg-orange-100 text-orange-800',
      'suspendido': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { id: 'id', label: 'ID' },
    { 
      id: 'nombre', 
      label: 'Nombre Completo', 
      render: (row) => `${row.nombre} ${row.apellido}` 
    },
    { 
      id: 'email', 
      label: 'Email',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Mail size={14} className="text-gray-500" />
          {row.email}
        </div>
      )
    },
    { 
      id: 'rut_completo', 
      label: 'RUT',
      render: (row) => row.rut_completo || `${row.rut}-${row.rut_verificador}`
    },
    { id: 'rol_id', label: 'Rol', render: (row) => getRolNombre(row.rol_id) },
    {
      id: 'estado',
      label: 'Estado',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoColor(row.estado)}`}>
          {row.estado}
        </span>
      ),
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-2">Administra los usuarios del sistema</p>
        </div>
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Usuario
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Tabla */}
      <Table
        columns={columns}
        data={users}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Juan"
            required
          />
          <Input
            label="Apellido"
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
            placeholder="Pérez"
            required
          />
        </div>

        {/* Email */}
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="juan@example.com"
          required
        />

        {/* Contraseña (solo en crear) */}
        {!editingUser && (
          <Input
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            required
          />
        )}

        {/* RUT - UN SOLO CAMPO */}
        <div>
          <Input
            label="RUT"
            value={formData.rut_completo}
            onChange={handleRutChange}
            placeholder="12749625-K"
            maxLength="12"
            required
            error={rutError}
          />
          {formData.rut_completo && !rutError && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-green-600 font-medium">✓ RUT válido</span>
              <span className="text-sm text-gray-500">Formato: {formData.rut_completo}</span>
            </div>
          )}
          {rutError && (
            <p className="text-sm text-red-600 mt-1">{rutError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Ingrese RUT sin puntos, solo con guión. Ejemplo: 12749625-K
          </p>
        </div>

        {/* Rol y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Rol"
            options={roles.map(r => ({ id: r.id, label: r.nombre }))}
            value={formData.rol_id}
            onChange={(e) => setFormData({ ...formData, rol_id: e.target.value })}
            required
          />

          <Select
            label="Estado"
            options={ESTADOS.map(e => ({ id: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))}
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            required
          />
        </div>
      </FormDialog>
    </div>
  );
}