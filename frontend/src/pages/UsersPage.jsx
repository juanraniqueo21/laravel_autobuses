import React, { useState, useEffect } from 'react';
import { Plus, Mail, Search, X, Users } from 'lucide-react'; // Agregado Users
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchUsers, fetchRoles, createUser, updateUser, deleteUser } from '../services/api';
import { useNotifications } from '../context/NotificationContext'; 

const ESTADOS = ['activo', 'inactivo', 'suspendido'];

// ============================================
// UTILIDADES
// ============================================

/**
 * Formatear RUT chileno mientras se escribe
 */
const formatRutChile = (rut) => {
  let cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length === 0) return '';
  let numero = cleaned.slice(0, -1);
  let dv = cleaned.slice(-1);
  if (cleaned.length === 1) return cleaned;
  return `${numero}-${dv}`;
};

/**
 * Validar formato básico de RUT
 */
const isValidRutFormat = (rut) => {
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length < 2) return false;
  const numero = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  if (!/^\d+$/.test(numero)) return false;
  if (!/^[0-9K]$/.test(dv)) return false;
  return true;
};

/**
 * Calcular dígito verificador de RUT (Módulo 11)
 */
const calcularDVRut = (rut) => {
  const numero = rut.replace(/[^0-9]/g, '');
  let suma = 0;
  let multiplo = 2;
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
 * Validar RUT completo
 */
const isValidRutComplete = (rut) => {
  if (!isValidRutFormat(rut)) return false;
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  const numero = cleaned.slice(0, -1);
  const dvIngresado = cleaned.slice(-1);
  const dvCalculado = calcularDVRut(numero);
  return dvIngresado === dvCalculado;
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [rutError, setRutError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); 

  // --- HOOK DE NOTIFICACIONES ---
  const { addNotification } = useNotifications();

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

  // Efecto para filtrar cuando cambian los usuarios o el término de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = users.filter((user) => {
        const nombreCompleto = `${user.nombre} ${user.apellido}`.toLowerCase();
        const rut = user.rut_completo ? user.rut_completo.toLowerCase() : '';
        const email = user.email.toLowerCase();
        
        return nombreCompleto.includes(lowerTerm) || 
               rut.includes(lowerTerm) || 
               email.includes(lowerTerm);
      });
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

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
      addNotification('error', 'Error', 'No se pudieron cargar los usuarios.');
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
    const formatted = formatRutChile(value);
    setFormData({ ...formData, rut_completo: formatted });
    
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
    if (!formData.rut_completo || !isValidRutComplete(formData.rut_completo)) {
      setRutError('RUT inválido. Verifique el formato y el dígito verificador');
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        addNotification('success', 'Usuario Actualizado', `Los datos de ${formData.nombre} han sido actualizados.`);
      } else {
        await createUser(formData);
        addNotification('success', 'Usuario Creado', `El usuario ${formData.nombre} ha sido creado.`);
      }
      await loadData();
      handleCloseDialog();
    } catch (err) {
      addNotification('error', 'Error', 'No se pudo guardar el usuario.');
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await deleteUser(id);
        addNotification('warning', 'Usuario Eliminado', 'El usuario ha sido eliminado del sistema.');
        loadData();
      } catch (err) {
        addNotification('error', 'Error', 'No se pudo eliminar el usuario.');
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
      
      {/* HEADER CARD NUEVO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Administra los usuarios y accesos del sistema.</p>
          </div>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => handleOpenDialog()} 
            className="flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Nuevo Usuario
          </Button>
        </div>
        <Users className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* BUSCADOR UNIFICADO */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={filteredUsers} // Usamos la lista filtrada
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

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="juan@example.com"
          required
        />

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