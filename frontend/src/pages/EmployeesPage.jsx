import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchEmpleados, fetchUsers, createEmpleado, updateEmpleado, deleteEmpleado } from '../services/api';

const CONTRATOS = ['indefinido', 'plazo_fijo', 'practicante'];
const ESTADOS = ['activo', 'licencia', 'suspendido', 'terminado'];

export default function EmployeesPage() {
  const [empleados, setEmpleados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [searchUsuario, setSearchUsuario] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    numero_empleado: '',
    fecha_contratacion: '',
    tipo_contrato: 'indefinido',
    salario_base: '',
    estado: 'activo',
  });

  useEffect(() => {
    loadEmpleados();
  }, []);

  const loadEmpleados = async () => {
    try {
      setLoading(true);
      const [empleadosData, usuariosData] = await Promise.all([
        fetchEmpleados(),
        fetchUsers(),
      ]);
      setEmpleados(empleadosData);
      setUsuarios(usuariosData);
      setError(null);
    } catch (err) {
      setError('Error al cargar empleados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (empleado = null) => {
    if (empleado) {
      setEditingEmpleado(empleado);
      setFormData(empleado);
    } else {
      setEditingEmpleado(null);
      setFormData({
        user_id: '',
        numero_empleado: '',
        fecha_contratacion: '',
        tipo_contrato: 'indefinido',
        salario_base: '',
        estado: 'activo',
      });
    }
    setSearchUsuario('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmpleado(null);
    setSearchUsuario('');
  };

  const handleSave = async () => {
    try {
      if (editingEmpleado) {
        await updateEmpleado(editingEmpleado.id, formData);
      } else {
        await createEmpleado(formData);
      }
      loadEmpleados();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await deleteEmpleado(id);
        loadEmpleados();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  const getUsuariosFiltrados = () => {
    return usuarios.filter(user => {
      const rol = user.rol?.nombre?.toLowerCase() || '';
      const busqueda = searchUsuario.toLowerCase();

      if (busqueda) {
        return rol.includes(busqueda);
      }
      return true;
    });
  };

  const getNombreUsuario = (userId) => {
    const user = usuarios.find(u => u.id === userId);
    return user ? `${user.nombre} ${user.apellido}` : 'N/A';
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'activo': 'bg-green-100 text-green-800',
      'licencia': 'bg-blue-100 text-blue-800',
      'suspendido': 'bg-orange-100 text-orange-800',
      'terminado': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { id: 'user_id', label: 'Usuario', render: (row) => getNombreUsuario(row.user_id) },
    { id: 'numero_empleado', label: 'Número Empleado' },
    { id: 'fecha_contratacion', label: 'Fecha Contratación' },
    { id: 'tipo_contrato', label: 'Tipo Contrato' },
    {
      id: 'salario_base',
      label: 'Salario',
      render: (row) => formatCurrency(row.salario_base),
    },
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Empleados</h1>
          <p className="text-gray-600 mt-2">Administra los empleados de la empresa</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Empleado
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
        data={empleados}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <Select
          label="Filtrar por Rol"
          options={[
            { id: '', label: 'Todos los usuarios' },
            { id: 'admin', label: 'Administradores' },
            { id: 'conductor', label: 'Conductores' },
            { id: 'mecanico', label: 'Mecánicos' },
            { id: 'asistente', label: 'Asistentes' },
            { id: 'rrhh', label: 'RRHH' },
            { id: 'gerente', label: 'Gerentes' },
          ]}
          value={searchUsuario}
          onChange={(e) => setSearchUsuario(e.target.value)}
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Usuario <span className="text-red-600">*</span>
          </label>
          <select
            value={formData.user_id}
            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Seleccione un usuario</option>
            {getUsuariosFiltrados().map((user) => (
              <option key={user.id} value={user.id}>
                {user.nombre} {user.apellido} - {user.rol?.nombre}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Número de Empleado"
          value={formData.numero_empleado}
          onChange={(e) => setFormData({ ...formData, numero_empleado: e.target.value })}
          required
        />

        <Input
          label="Fecha de Contratación"
          type="date"
          value={formData.fecha_contratacion}
          onChange={(e) => setFormData({ ...formData, fecha_contratacion: e.target.value })}
          required
        />

        <Select
          label="Tipo de Contrato"
          options={CONTRATOS.map(c => ({ id: c, label: c }))}
          value={formData.tipo_contrato}
          onChange={(e) => setFormData({ ...formData, tipo_contrato: e.target.value })}
          required
        />

        <Input
          label="Salario Base (CLP)"
          type="number"
          value={formData.salario_base}
          onChange={(e) => setFormData({ ...formData, salario_base: parseInt(e.target.value) })}
          required
        />

        <Select
          label="Estado"
          options={ESTADOS.map(e => ({ id: e, label: e }))}
          value={formData.estado}
          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
          required
        />
      </FormDialog>
    </div>
  );
}