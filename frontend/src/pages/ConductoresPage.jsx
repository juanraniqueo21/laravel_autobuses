import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchConductores, fetchEmpleados, createConductor, updateConductor, deleteConductor } from '../services/api';

const CLASES_LICENCIA = ['A', 'A2', 'A3', 'B', 'C', 'D', 'E'];
const ESTADOS = ['activo', 'baja_medica', 'suspendido', 'inactivo'];
const ESTADOS_LICENCIA = ['vigente', 'vencida', 'suspendida'];

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export default function ConductoresPage() {
  const [conductores, setConductores] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingConductor, setEditingConductor] = useState(null);
  const [formData, setFormData] = useState({
    empleado_id: '',
    numero_licencia: '',
    clase_licencia: 'E',
    fecha_vencimiento_licencia: '',
    fecha_primera_licencia: '',
    estado: 'activo',
    anios_experiencia: 0,
    estado_licencia: 'vigente',
    observaciones_licencia: '',
    cantidad_infracciones: 0,
    cantidad_accidentes: 0,
    historial_sanciones: '',
    fecha_examen_ocupacional: '',
    apto_conducir: true,
    certificado_rcp: false,
    vencimiento_rcp: '',
    certificado_defensa: false,
    vencimiento_defensa: '',
  });

  useEffect(() => {
    loadConductores();
  }, []);

  const loadConductores = async () => {
    try {
      setLoading(true);
      const [conductoresData, empleadosData] = await Promise.all([
        fetchConductores(),
        fetchEmpleados(''),
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
      setFormData({
        empleado_id: conductor.empleado_id || '',
        numero_licencia: conductor.numero_licencia || '',
        clase_licencia: conductor.clase_licencia || 'E',
        fecha_vencimiento_licencia: conductor.fecha_vencimiento_licencia || '',
        fecha_primera_licencia: conductor.fecha_primera_licencia || '',
        estado: conductor.estado || 'activo',
        anios_experiencia: conductor.anios_experiencia || 0,
        estado_licencia: conductor.estado_licencia || 'vigente',
        observaciones_licencia: conductor.observaciones_licencia || '',
        cantidad_infracciones: conductor.cantidad_infracciones || 0,
        cantidad_accidentes: conductor.cantidad_accidentes || 0,
        historial_sanciones: conductor.historial_sanciones || '',
        fecha_examen_ocupacional: conductor.fecha_examen_ocupacional || '',
        apto_conducir: conductor.apto_conducir !== undefined ? conductor.apto_conducir : true,
        certificado_rcp: conductor.certificado_rcp !== undefined ? conductor.certificado_rcp : false,
        vencimiento_rcp: conductor.vencimiento_rcp || '',
        certificado_defensa: conductor.certificado_defensa !== undefined ? conductor.certificado_defensa : false,
        vencimiento_defensa: conductor.vencimiento_defensa || '',
      });
    } else {
      setEditingConductor(null);
      setFormData({
        empleado_id: '',
        numero_licencia: '',
        clase_licencia: 'E',
        fecha_vencimiento_licencia: '',
        fecha_primera_licencia: '',
        estado: 'activo',
        anios_experiencia: 0,
        estado_licencia: 'vigente',
        observaciones_licencia: '',
        cantidad_infracciones: 0,
        cantidad_accidentes: 0,
        historial_sanciones: '',
        fecha_examen_ocupacional: '',
        apto_conducir: true,
        certificado_rcp: false,
        vencimiento_rcp: '',
        certificado_defensa: false,
        vencimiento_defensa: '',
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

  const isLicenseExpired = (date) => {
    if (!date) return false;
    const today = new Date();
    const expiryDate = new Date(date);
    return expiryDate < today;
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

  const getNombreEmpleado = (empleadoId) => {
    const empleado = empleados.find(e => e.id === empleadoId);
    if (empleado?.user) {
      return `${empleado.user.nombre} ${empleado.user.apellido}`;
    }
    return 'N/A';
  };

  // Tabla expandible personalizada
  const renderConductoresTable = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Conductor</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Licencia</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Clase</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Vencimiento</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Experiencia</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conductores.map((conductor) => (
              <React.Fragment key={conductor.id}>
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{getNombreEmpleado(conductor.empleado_id)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{conductor.numero_licencia}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{conductor.clase_licencia}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className={
                      isLicenseExpired(conductor.fecha_vencimiento_licencia) 
                        ? 'text-red-600 font-bold' 
                        : isLicenseExpiring(conductor.fecha_vencimiento_licencia) 
                        ? 'text-orange-600 font-bold' 
                        : ''
                    }>
                      {formatDate(conductor.fecha_vencimiento_licencia)}
                      {isLicenseExpired(conductor.fecha_vencimiento_licencia) && ' ❌'}
                      {isLicenseExpiring(conductor.fecha_vencimiento_licencia) && !isLicenseExpired(conductor.fecha_vencimiento_licencia) && ' ⚠️'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{conductor.anios_experiencia} años</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoColor(conductor.estado)}`}>
                      {conductor.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button
                      onClick={() => handleOpenDialog(conductor)}
                      className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(conductor.id)}
                      className="text-red-600 hover:text-red-900 font-medium text-sm"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedRow(expandedRow === conductor.id ? null : conductor.id);
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {expandedRow === conductor.id ? '▲' : '▼'}
                    </button>
                  </td>
                </tr>

                {/* Fila expandida con detalles */}
                {expandedRow === conductor.id && (
                  <tr className="bg-gray-50 border-b">
                    <td colSpan="7" className="px-6 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Licencia */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Información de Licencia</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-gray-600">Número:</span> {conductor.numero_licencia}</p>
                            <p><span className="text-gray-600">Clase:</span> {conductor.clase_licencia}</p>
                            <p><span className="text-gray-600">Emisión:</span> {formatDate(conductor.fecha_primera_licencia)}</p>
                            <p><span className="text-gray-600">Vencimiento:</span> {formatDate(conductor.fecha_vencimiento_licencia)}</p>
                            <p><span className="text-gray-600">Estado:</span> {conductor.estado_licencia}</p>
                            {conductor.observaciones_licencia && (
                              <p><span className="text-gray-600">Observaciones:</span> {conductor.observaciones_licencia}</p>
                            )}
                          </div>
                        </div>

                        {/* Experiencia y Sanciones */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Experiencia & Sanciones</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-gray-600">Años de experiencia:</span> {conductor.anios_experiencia}</p>
                            <p><span className="text-gray-600">Infracciones:</span> {conductor.cantidad_infracciones}</p>
                            <p><span className="text-gray-600">Accidentes:</span> {conductor.cantidad_accidentes}</p>
                            {conductor.historial_sanciones && (
                              <p><span className="text-gray-600">Historial:</span> {conductor.historial_sanciones}</p>
                            )}
                          </div>
                        </div>

                        {/* Salud y Certificados */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Salud & Certificados</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-gray-600">Fecha Examen Ocupacional:</span> {formatDate(conductor.fecha_examen_ocupacional)}</p>
                            <p><span className="text-gray-600">Apto para conducir:</span> {conductor.apto_conducir ? '✅ Sí' : '❌ No'}</p>
                            <p><span className="text-gray-600">RCP:</span> {conductor.certificado_rcp ? '✅ Sí' : '❌ No'}</p>
                            {conductor.vencimiento_rcp && (
                              <p><span className="text-gray-600">Vencimiento RCP:</span> {formatDate(conductor.vencimiento_rcp)}</p>
                            )}
                            <p><span className="text-gray-600">Defensa:</span> {conductor.certificado_defensa ? '✅ Sí' : '❌ No'}</p>
                            {conductor.vencimiento_defensa && (
                              <p><span className="text-gray-600">Vencimiento Defensa:</span> {formatDate(conductor.vencimiento_defensa)}</p>
                            )}
                          </div>
                        </div>

                        {/* Estado General */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Estado General</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-gray-600">Estado:</span> {conductor.estado}</p>
                            <p><span className="text-gray-600">Empleado:</span> {getNombreEmpleado(conductor.empleado_id)}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : conductores.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No hay conductores registrados</div>
      ) : (
        renderConductoresTable()
      )}

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingConductor ? 'Editar Conductor' : 'Nuevo Conductor'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        {/* SECCIÓN 1: DATOS BÁSICOS */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Básicos</h3>
          
          <Select
            label="Empleado"
            options={[
              { id: '', label: 'Seleccione empleado' },
              ...empleados
                .filter(emp =>
                  // solo mostrar empleados con rol conductor (3)
                  emp.user?.rol_id === 3 &&
                  // que no esten ya enla tabla conductores
                  (!conductores.some(c => c.empleado_id === emp.id) || emp.id === formData.empleado_id)
                )
                .map(emp => ({
                  id: emp.id,
                  label: `${emp.user?.nombre} ${emp.user?.apellido}`
                }))
            ]}
            value={formData.empleado_id}
            onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
            required

                
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
          </div>
        </div>

        {/* SECCIÓN 2: LICENCIA */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Licencia</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Select
              label="Estado de Licencia"
              options={[
                { id: 'vigente', label: 'Vigente' },
                { id: 'vencida', label: 'Vencida' },
                { id: 'suspendida', label: 'Suspendida' },
              ]}
              value={formData.estado_licencia}
              onChange={(e) => setFormData({ ...formData, estado_licencia: e.target.value })}
              required
            />
            <Input
              label="Observaciones (Códigos VÍA)"
              value={formData.observaciones_licencia}
              onChange={(e) => setFormData({ ...formData, observaciones_licencia: e.target.value })}
              placeholder="Ej: 01 (gafas), 02 (solo día)"
            />
          </div>
        </div>

        {/* SECCIÓN 3: EXPERIENCIA */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Experiencia & Sanciones</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Años de Experiencia"
              type="number"
              value={formData.anios_experiencia}
              onChange={(e) => setFormData({ ...formData, anios_experiencia: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Cantidad de Infracciones"
              type="number"
              value={formData.cantidad_infracciones}
              onChange={(e) => setFormData({ ...formData, cantidad_infracciones: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Cantidad de Accidentes"
              type="number"
              value={formData.cantidad_accidentes}
              onChange={(e) => setFormData({ ...formData, cantidad_accidentes: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Historial de Sanciones"
              value={formData.historial_sanciones}
              onChange={(e) => setFormData({ ...formData, historial_sanciones: e.target.value })}
              placeholder="Descripción de sanciones o antecedentes"
            />
          </div>
        </div>

        {/* SECCIÓN 4: SALUD */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Salud & Aptitud</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha Examen Ocupacional"
              type="date"
              value={formData.fecha_examen_ocupacional}
              onChange={(e) => setFormData({ ...formData, fecha_examen_ocupacional: e.target.value })}
            />
          </div>

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
          </div>
        </div>

        {/* SECCIÓN 5: CERTIFICADOS */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificados</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.certificado_rcp}
                onChange={(e) => setFormData({ ...formData, certificado_rcp: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Certificado RCP</span>
            </label>

            {formData.certificado_rcp && (
              <Input
                label="Vencimiento RCP"
                type="date"
                value={formData.vencimiento_rcp}
                onChange={(e) => setFormData({ ...formData, vencimiento_rcp: e.target.value })}
              />
            )}
          </div>

          <div className="space-y-3 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.certificado_defensa}
                onChange={(e) => setFormData({ ...formData, certificado_defensa: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Certificado Defensa</span>
            </label>

            {formData.certificado_defensa && (
              <Input
                label="Vencimiento Defensa"
                type="date"
                value={formData.vencimiento_defensa}
                onChange={(e) => setFormData({ ...formData, vencimiento_defensa: e.target.value })}
              />
            )}
          </div>
        </div>

        {/* SECCIÓN 6: ESTADO */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado</h3>
          
          <Select
            label="Estado del Conductor"
            options={ESTADOS.map(e => ({ id: e, label: e }))}
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            required
          />
        </div>
      </FormDialog>
    </div>
  );
}