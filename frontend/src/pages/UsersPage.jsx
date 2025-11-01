import React, { useState, useEffect } from 'react';
import { Plus, Phone, Mail } from 'lucide-react';
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
 * Formatear teléfono chileno
 * Entrada: 976046231
 * Salida: +56 9 7604 6231
 */
const formatPhoneChile = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `+56 ${cleaned.charAt(0)} ${cleaned.substring(1, 5)} ${cleaned.substring(5)}`;
  }
  
  return phone;
};

/**
 * Validar teléfono chileno
 * Solo acepta 9 dígitos empezando con 9
 */
const isValidPhoneChile = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 9 && cleaned.startsWith('9');
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rut: '',
    rut_verificador: '',
    telefono: '',
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
    setPhoneError('');
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        password: '',
        rut: user.rut,
        rut_verificador: user.rut_verificador,
        telefono: user.telefono,
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
        rut: '',
        rut_verificador: '',
        telefono: '',
        rol_id: roles.length > 0 ? roles[0].id : '',
        estado: 'activo',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setPhoneError('');
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo dígitos
    setFormData({ ...formData, telefono: value });
    
    // Validar en tiempo real
    if (value && !isValidPhoneChile(value)) {
      setPhoneError('Teléfono debe tener 9 dígitos y empezar con 9');
    } else {
      setPhoneError('');
    }
  };

  const handleSave = async () => {
    // Validar teléfono antes de guardar
    if (!formData.telefono || !isValidPhoneChile(formData.telefono)) {
      setPhoneError('Teléfono inválido. Debe tener 9 dígitos y empezar con 9');
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
      } else {
        await createUser(formData);
      }
      loadData();
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
      id: 'telefono', 
      label: 'Teléfono',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Phone size={14} className="text-gray-500" />
          {formatPhoneChile(row.telefono)}
        </div>
      )
    },
    { id: 'rut', label: 'RUT' },
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

        {/* RUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="RUT"
            value={formData.rut}
            onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
            placeholder="12.345.678"
            required
          />
          <Input
            label="RUT Verificador"
            value={formData.rut_verificador}
            onChange={(e) => setFormData({ ...formData, rut_verificador: e.target.value.toUpperCase() })}
            placeholder="0-9 o K"
            maxLength="1"
            required
          />
        </div>

        {/* Teléfono */}
        <div>
          <Input
            label="Teléfono"
            type="tel"
            value={formData.telefono}
            onChange={handlePhoneChange}
            placeholder="9 7604 6231"
            maxLength="9"
            required
            error={phoneError}
          />
          {formData.telefono && (
            <p className="text-sm text-gray-500 mt-1">
              Formato: {formatPhoneChile(formData.telefono)}
            </p>
          )}
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