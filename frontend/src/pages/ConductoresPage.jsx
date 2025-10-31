import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchConductores, fetchEmpleados, createConductor, updateConductor, deleteConductor } from '../services/api';

const CLASES_LICENCIA = ['A', 'B', 'C', 'D', 'E'];
const ESTADOS = ['activo', 'baja_medica', 'suspendido', 'inactivo'];
const ESTADOS_LICENCIA = ['vigente', 'vencida', 'suspendida'];

export default function ConductoresPage() {
  const [conductores, setConductores] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConductor, setEditingConductor] = useState(null);
  const [formData, setFormData] = useState({
    empleado_id: '',
    numero_licencia: '',
    clase_licencia: 'E',
    fecha_vencimiento_licencia: '',
    fecha_primera_licencia: '',
    puntos_licencia: 0,
    estado: 'activo',
    anios_experiencia: 0,
    estado_licencia: 'vigente',
    apto_conducir: true,
    certificado_rcp: false,
    certificado_defensa: false,
  });

  useEffect(() => {
    loadConductores();
  }, []);

  const loadConductores = async () => {
    try {
      setLoading(true);
      const [conductoresData, empleadosData] = await Promise.all([
        fetchConductores(),
        fetchEmpleados(),
      ]);
      setConductores(conductoresData);
      setEmpleados(empleadosData);
      setError(null);
    } catch (err) {
      setError('Error al cargar conductores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (conductor = null) => {
    if (conductor) {
      setEditingConductor(conductor);
      setFormData(conductor);
    } else {
      setEditingConductor(null);
      setFormData({
        empleado_id: '',
        numero_licencia: '',
        clase_licencia: 'E',
        fecha_primera_licencia: '',
        fecha_vencimiento_licencia: '',
        puntos_licencia: 0,
        estado: 'activo',
        anios_experiencia: 0,
        estado_licencia: 'vigente',
        apto_conducir: true,
        certificado_rcp: false,
        certificado_defensa: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingConductor(null);
  };

  const handleSave = async () => {
    try {
      if (editingConductor) {
        await updateConductor(editingConductor.id, formData);
      } else {
        await createConductor(formData);
      }
      loadConductores();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await deleteConductor(id);
        loadConductores();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const isLicenseExpiring = (date) => {
    if (!date) return false;
    const today = new Date();
    const expiryDate = new Date(date);
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft < 60 && daysLeft > 0;
  };

  const getEstadoColor = (estado) => {
    const colors = {
      'activo': 'bg-green-100 text-green-800',
      'baja_medica': 'bg-blue-100 text-blue-800',
      'suspendido': 'bg-orange-100 text-orange-800',
      'inactivo': 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    { id: 'empleado_id', label: 'Empleado ID' },
    { id: 'numero_licencia', label: 'Número Licencia' },
    { id: 'clase_licencia', label: 'Clase' },
    { id: 'fecha_primera_licencia', label: 'Emisión' },
    {
      id: 'fecha_vencimiento_licencia',
      label: 'Vencimiento',
      render: (row) => (
        <div className={isLicenseExpiring(row.fecha_vencimiento_licencia) ? 'text-orange-600 font-bold' : ''}>
          {row.fecha_vencimiento_licencia}
          {isLicenseExpiring(row.fecha_vencimiento_licencia) && ' ⚠️'}
        </div>
      ),
    },
    { id: 'anios_experiencia', label: 'Años Exp.' },
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Conductores</h1>
          <p className="text-gray-600 mt-2">Administra los conductores de la empresa</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleOpenDialog()}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Conductor
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
        data={conductores}
        loading={loading}
        onEdit={handleOpenDialog}
        onDelete={handleDelete}
      />

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingConductor ? 'Editar Conductor' : 'Nuevo Conductor'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <Select
          label="Empleado"
          options={empleados.filter(emp => emp.user?.rol_id === 3).map(emp => ({
            id: emp.id,
            label: `${emp.user?.nombre} ${emp.user?.apellido}`
          }))}
          value={formData.empleado_id}
          onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
          required
        />

        <Input
          label="Número de Licencia"
          value={formData.numero_licencia}
          onChange={(e) => setFormData({ ...formData, numero_licencia: e.target.value })}
          required
        />

        <Select
          label="Clase de Licencia"
          options={CLASES_LICENCIA.map(c => ({ id: c, label: c }))}
          value={formData.clase_licencia}
          onChange={(e) => setFormData({ ...formData, clase_licencia: e.target.value })}
          required
        />

        <Input
          label="Fecha de Emisión"
          type="date"
          value={formData.fecha_primera_licencia}
          onChange={(e) => setFormData({ ...formData, fecha_primera_licencia: e.target.value })}
          required
        />

        <Input
          label="Fecha de Vencimiento"
          type="date"
          value={formData.fecha_vencimiento_licencia}
          onChange={(e) => setFormData({ ...formData, fecha_vencimiento_licencia: e.target.value })}
          required
        />

        <Input
          label="Años de Experiencia"
          type="number"
          value={formData.anios_experiencia}
          onChange={(e) => setFormData({ ...formData, anios_experiencia: parseInt(e.target.value) })}
          required
        />

        <Input
          label="Puntos de Licencia"
          type="number"
          value={formData.puntos_licencia}
          onChange={(e) => setFormData({ ...formData, puntos_licencia: parseInt(e.target.value) })}
        />

        <Select
          label="Estado de Licencia"
          options={ESTADOS_LICENCIA.map(e => ({ id: e, label: e }))}
          value={formData.estado_licencia}
          onChange={(e) => setFormData({ ...formData, estado_licencia: e.target.value })}
          required
        />

        <Select
          label="Estado"
          options={ESTADOS.map(e => ({ id: e, label: e }))}
          value={formData.estado}
          onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
          required
        />

        {/* Checkboxes */}
        <div className="space-y-3 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.apto_conducir}
              onChange={(e) => setFormData({ ...formData, apto_conducir: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Apto para Conducir</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.certificado_rcp}
              onChange={(e) => setFormData({ ...formData, certificado_rcp: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Certificado RCP</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.certificado_defensa}
              onChange={(e) => setFormData({ ...formData, certificado_defensa: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Certificado Defensa</span>
          </label>
        </div>
      </FormDialog>
    </div>
  );
}