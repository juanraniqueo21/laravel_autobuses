import React, { useState, useEffect } from 'react';
import { Plus, Search, X, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { fetchRoles, createRole, updateRole, deleteRole } from '../services/api';
import usePagination from '../hooks/usePagination';
import { useNotifications } from '../context/NotificationContext';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

  const { addNotification } = useNotifications();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await fetchRoles();
      setRoles(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Error al cargar roles: ' + err.message);
      addNotification('error', 'Error', 'No se pudieron cargar los roles.');
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Filtrado y Ordenamiento
  const getFilteredRoles = () => {
    // CAMBIO AQUÍ: a.id - b.id ordena de menor a mayor (primero ingresado, primero en la lista)
    let data = [...roles].sort((a, b) => a.id - b.id);

    // Filtrar por buscador
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(r => 
        r.nombre.toLowerCase().includes(lowerTerm) ||
        (r.descripcion && r.descripcion.toLowerCase().includes(lowerTerm))
      );
    }
    return data;
  };

  const filteredData = getFilteredRoles();
  const { currentPage, setCurrentPage, totalPages, paginatedData } = usePagination(filteredData, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({ nombre: role.nombre, descripcion: role.descripcion || '' });
    } else {
      setEditingRole(null);
      setFormData({ nombre: '', descripcion: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
    setFormData({ nombre: '', descripcion: '' });
  };

  const handleSave = async () => {
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
        addNotification('success', 'Rol Actualizado', `El rol ${formData.nombre} ha sido modificado.`);
      } else {
        await createRole(formData);
        addNotification('success', 'Rol Creado', `El rol ${formData.nombre} ha sido creado exitosamente.`);
      }
      loadRoles();
      handleCloseDialog();
    } catch (err) {
      addNotification('error', 'Error', 'No se pudo guardar el rol.');
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este rol?')) {
      try {
        await deleteRole(id);
        addNotification('warning', 'Rol Eliminado', 'El rol ha sido eliminado del sistema.');
        loadRoles();
      } catch (err) {
        addNotification('error', 'Error', 'No se pudo eliminar el rol.');
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const columns = [
    { 
      id: 'nombre', 
      label: 'Nombre',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-blue-600" />
          <span className="font-medium capitalize">{row.nombre}</span>
        </div>
      )
    },
    { id: 'descripcion', label: 'Descripción', render: (row) => row.descripcion || <span className="text-gray-400 italic">Sin descripción</span> },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Roles</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Define los perfiles de acceso del sistema.</p>
          </div>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => handleOpenDialog()} 
            className="flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Nuevo Rol
          </Button>
        </div>
        <Shield className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar rol por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        data={paginatedData}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-700">
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            <span className="ml-2">(Total: {filteredData.length} roles)</span>
          </span>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={() => setCurrentPage(prev => prev - 1)} 
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft size={16} /> Anterior
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setCurrentPage(prev => prev + 1)} 
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              Siguiente <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      <FormDialog
        isOpen={openDialog}
        title={editingRole ? 'Editar Rol' : 'Nuevo Rol'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <Input
          label="Nombre del Rol *"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
          placeholder="Ej: Conductor, Mecánico"
        />
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Describe los permisos o funciones de este rol..."
          />
        </div>
      </FormDialog>
    </div>
  );
}