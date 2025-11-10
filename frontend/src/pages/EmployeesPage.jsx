import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Phone, MapPin, DollarSign, Search, X, Mail } from 'lucide-react';
import Table from '../components/tables/Table';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { fetchEmpleados, fetchUsers, fetchAfps, fetchIsapres, createEmpleado, updateEmpleado, deleteEmpleado } from '../services/api';

const CONTRATOS = ['indefinido', 'plazo_fijo', 'practicante'];
const ESTADOS = ['activo', 'licencia', 'suspendido', 'terminado'];
const TRAMOS_FONASA = [
  { id: 'A', label: 'Tramo A - Personas de escasos recursos' },
  { id: 'B', label: 'Tramo B - Ingresos ≤ $529.000' },
  { id: 'C', label: 'Tramo C - Ingresos $529.001 - $772.340' },
  { id: 'D', label: 'Tramo D - Ingresos > $772.341' },
];
const GENEROS = [
  { id: 'masculino', label: 'Masculino' },
  { id: 'femenino', label: 'Femenino' },
  { id: 'otro', label: 'Otro' },
];
const TIPOS_CUENTA = [
  { id: 'corriente', label: 'Corriente' },
  { id: 'ahorro', label: 'Ahorro' },
];

// Utilidades
const formatPhoneChile = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `+56 ${cleaned.charAt(0)} ${cleaned.substring(1, 5)} ${cleaned.substring(5)}`;
  }
  return phone;
};

const isValidPhoneChile = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 9 && cleaned.startsWith('9');
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-CL');
};

const formatRUT = (rut, verificador) => {
  if (!rut) return '-';
  return `${new Intl.NumberFormat('es-CL').format(rut)}-${verificador}`;
};

export default function EmployeesPage() {
  const [empleados, setEmpleados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [afps, setAfps] = useState([]);
  const [isapres, setIsapres] = useState([]);
  const [searchUsuario, setSearchUsuario] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [phoneErrors, setPhoneErrors] = useState({});
  const [formData, setFormData] = useState({
    user_id: '',
    foto: null,
    numero_empleado: '',
    fecha_contratacion: '',
    fecha_termino: '',
    tipo_contrato: 'indefinido',
    salario_base: '',
    estado: 'activo',
    ciudad: '',
    direccion: '',
    telefono_personal: '',
    fecha_nacimiento: '',
    genero: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    contacto_emergencia_relacion: '',
    afp_id: '',
    tipo_fonasa: 'B',
    isapre_id: '',
    numero_seguro_cesantia: '',
    banco: '',
    tipo_cuenta: '',
    numero_cuenta: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empleadosData, usuariosData, afpsData, isapresData] = await Promise.all([
        fetchEmpleados(),
        fetchUsers(),
        fetchAfps(),
        fetchIsapres(),
      ]);
      setEmpleados(empleadosData);
      setUsuarios(usuariosData);
      setAfps(afpsData);
      setIsapres(isapresData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (empleado = null) => {
    setPhoneErrors({});
    if (empleado) {
      setEditingEmpleado(empleado);
      setFormData({
        user_id: empleado.user_id?.toString() || '',
        numero_empleado: empleado.numero_empleado || '',
        fecha_contratacion: empleado.fecha_contratacion ? empleado.fecha_contratacion.split('T')[0] : '',
        fecha_termino: empleado.fecha_termino ? empleado.fecha_termino.split('T')[0] : '',
        tipo_contrato: empleado.tipo_contrato || 'indefinido',
        salario_base: empleado.salario_base || '',
        estado: empleado.estado || 'activo',
        ciudad: empleado.ciudad || '',
        direccion: empleado.direccion || '',
        telefono_personal: empleado.telefono_personal || '',
        fecha_nacimiento: empleado.fecha_nacimiento ? empleado.fecha_nacimiento.split('T')[0] : '',
        genero: empleado.genero || '',
        contacto_emergencia_nombre: empleado.contacto_emergencia_nombre || '',
        contacto_emergencia_telefono: empleado.contacto_emergencia_telefono || '',
        contacto_emergencia_relacion: empleado.contacto_emergencia_relacion || '',
        afp_id: empleado.afp_id || '',
        tipo_fonasa: empleado.tipo_fonasa || 'B',
        isapre_id: empleado.isapre_id || '',
        numero_seguro_cesantia: empleado.numero_seguro_cesantia || '',
        banco: empleado.banco || '',
        tipo_cuenta: empleado.tipo_cuenta || '',
        numero_cuenta: empleado.numero_cuenta || '',
      });
    } else {
      setEditingEmpleado(null);
      setFormData({
        user_id: '',
        numero_empleado: '',
        fecha_contratacion: '',
        fecha_termino: '',
        tipo_contrato: 'indefinido',
        salario_base: '',
        estado: 'activo',
        ciudad: '',
        direccion: '',
        telefono_personal: '',
        fecha_nacimiento: '',
        genero: '',
        contacto_emergencia_nombre: '',
        contacto_emergencia_telefono: '',
        contacto_emergencia_relacion: '',
        afp_id: '',
        tipo_fonasa: 'B',
        isapre_id: '',
        numero_seguro_cesantia: '',
        banco: '',
        tipo_cuenta: '',
        numero_cuenta: '',
      });
    }
    setSearchUsuario('');
    setOpenDialog(true);
  };

  // Obtener datos del usuario seleccionado
  const getSelectedUserData = () => {
    if (!formData.user_id) return null;
    return usuarios.find(u => u.id === parseInt(formData.user_id));
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmpleado(null);
    setSearchUsuario('');
    setPhoneErrors({});
  };

  const handlePhoneChange = (field, value) => {
    const cleaned = value.replace(/\D/g, '');
    setFormData({ ...formData, [field]: cleaned });

    if (cleaned && !isValidPhoneChile(cleaned)) {
      setPhoneErrors({ ...phoneErrors, [field]: 'Teléfono debe tener 9 dígitos y empezar con 9' });
    } else {
      const newErrors = { ...phoneErrors };
      delete newErrors[field];
      setPhoneErrors(newErrors);
    }
  };

  const handleSave = async () => {
    // Validar campos requeridos
    if (!formData.user_id || !formData.numero_empleado || !formData.fecha_contratacion || !formData.salario_base) {
      setError('Por favor complete los campos requeridos (*)');
      return;
    }

    // Validar teléfonos
    if (formData.telefono_personal && !isValidPhoneChile(formData.telefono_personal)) {
      setPhoneErrors({ ...phoneErrors, telefono_personal: 'Teléfono debe tener 9 dígitos y empezar con 9' });
      return;
    }
    if (formData.contacto_emergencia_telefono && !isValidPhoneChile(formData.contacto_emergencia_telefono)) {
      setPhoneErrors({ ...phoneErrors, contacto_emergencia_telefono: 'Teléfono debe tener 9 dígitos y empezar con 9' });
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        user_id: parseInt(formData.user_id),
        salario_base: parseInt(formData.salario_base) || 0
      };

      if (editingEmpleado) {
        await updateEmpleado(editingEmpleado.id, dataToSave);
      } else {
        await createEmpleado(dataToSave);
      }
      loadData();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      console.error('Error al guardar:', err);
      if (err.response?.status === 400) {
        setError('Datos inválidos: ' + (err.response.data?.message || 'Verifique los campos'));
      } else if (err.response?.status === 409) {
        setError('El número de empleado ya existe');
      } else {
        setError('Error al guardar: ' + (err.message || 'Intente nuevamente'));
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este empleado?')) {
      try {
        await deleteEmpleado(id);
        loadData();
        setError(null);
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const getNombreUsuario = (userId) => {
    const user = usuarios.find(u => u.id === userId);
    return user ? `${user.nombre} ${user.apellido}` : 'N/A';
  };

  const getRUTUsuario = (userId) => {
    const user = usuarios.find(u => u.id === userId);
    return user ? formatRUT(user.rut, user.rut_verificador) : '-';
  };

  const getNombreAfp = (afpId) => {
    const afp = afps.find(a => a.id === afpId);
    return afp ? afp.nombre : '-';
  };

  const getNombreIsapre = (isapreId) => {
    const isapre = isapres.find(i => i.id === isapreId);
    return isapre ? isapre.nombre : '-';
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

  // MEJORADO: Filtrar empleados con sistema de puntuación
  const getEmpleadosFiltrados = () => {
    if (!searchTerm.trim()) {
      return empleados; // Mostrar todos cuando no hay búsqueda
    }

    const busqueda = searchTerm.toLowerCase().trim();
    
    const resultados = empleados
      .map((empleado) => {
        const user = usuarios.find(u => u.id === empleado.user_id);
        if (!user) return null;

        const nombreCompleto = `${user.nombre} ${user.apellido}`.toLowerCase();
        const nombre = user.nombre.toLowerCase();
        const apellido = user.apellido.toLowerCase();
        const rut = `${user.rut}${user.rut_verificador}`.replace(/\D/g, '');
        const rutFormateado = formatRUT(user.rut, user.rut_verificador).toLowerCase();
        const numeroEmpleado = empleado.numero_empleado?.toLowerCase() || '';

        // 🎯 SISTEMA DE PUNTUACIÓN (mayor puntaje = más relevante)
        let score = 0;

        // COINCIDENCIA EXACTA DE NOMBRE COMPLETO (100 puntos)
        if (nombreCompleto === busqueda) {
          score += 100;
        }
        // NOMBRE COMPLETO COMIENZA CON LA BÚSQUEDA (80 puntos)
        else if (nombreCompleto.startsWith(busqueda)) {
          score += 80;
        }
        // NOMBRE COMPLETO CONTIENE LA BÚSQUEDA (50 puntos)
        else if (nombreCompleto.includes(busqueda)) {
          score += 50;
        }

        // COINCIDENCIA EXACTA DE NOMBRE O APELLIDO (70 puntos)
        if (nombre === busqueda || apellido === busqueda) {
          score += 70;
        }
        // NOMBRE O APELLIDO COMIENZA CON LA BÚSQUEDA (60 puntos)
        else if (nombre.startsWith(busqueda) || apellido.startsWith(busqueda)) {
          score += 60;
        }
        // NOMBRE O APELLIDO CONTIENE LA BÚSQUEDA (30 puntos)
        else if (nombre.includes(busqueda) || apellido.includes(busqueda)) {
          score += 30;
        }

        // COINCIDENCIA DE RUT (90 puntos - alta prioridad)
        const busquedaLimpia = busqueda.replace(/\D/g, '');
        if (rut === busquedaLimpia || rutFormateado.includes(busqueda)) {
          score += 90;
        }

        // COINCIDENCIA DE NÚMERO DE EMPLEADO (85 puntos)
        if (numeroEmpleado === busqueda) {
          score += 85;
        } else if (numeroEmpleado.includes(busqueda)) {
          score += 40;
        }

        // Si no hay coincidencia, devolver null
        if (score === 0) return null;

        return {
          empleado,
          score
        };
      })
      .filter(item => item !== null) // Eliminar nulls
      .sort((a, b) => b.score - a.score) // Ordenar por score descendente
      .map(item => item.empleado); // Devolver solo el empleado

    return resultados;
  };

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Tabla expandible personalizada
  const renderEmpleadosTable = () => {
    const empleadosFiltrados = getEmpleadosFiltrados();

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Barra de búsqueda */}
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Busca por RUT, nombre o número de empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              {empleadosFiltrados.length} empleado(s) encontrado(s)
            </p>
          )}
        </div>

        {/* Estado vacío cuando no hay empleados */}
        {empleadosFiltrados.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm 
                ? `No hay resultados para "${searchTerm}". Intenta con otro término de búsqueda.`
                : 'Comienza agregando el primer empleado usando el botón "Nuevo Empleado".'
              }
            </p>
          </div>
        ) : (
          // Tabla con resultados
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Usuario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">RUT</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">N° Empleado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Contratación</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Salario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleadosFiltrados.map((empleado) => (
                <React.Fragment key={empleado.id}>
                  <tr className="border-b hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 text-sm text-gray-900">{getNombreUsuario(empleado.user_id)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getRUTUsuario(empleado.user_id)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{empleado.numero_empleado}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(empleado.fecha_contratacion)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(empleado.salario_base)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getEstadoColor(empleado.estado)}`}>
                        {empleado.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenDialog(empleado)}
                        className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(empleado.id)}
                        className="text-red-600 hover:text-red-900 font-medium text-sm"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRow(expandedRow === empleado.id ? null : empleado.id);
                        }}
                        className="text-gray-600 hover:text-gray-900 font-medium text-sm inline-flex items-center"
                      >
                        {expandedRow === empleado.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                  </tr>

                  {/* Fila expandida con todos los detalles */}
                  {expandedRow === empleado.id && (
                    <tr className="bg-gray-50 border-b">
                      <td colSpan="7" className="px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Datos Personales */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Datos Personales</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="text-gray-600">RUT:</span> {getRUTUsuario(empleado.user_id)}</p>
                              <p><span className="text-gray-600">Email:</span> {(() => {
                                const user = usuarios.find(u => u.id === empleado.user_id);
                                return user ? user.email : '-';
                              })()}</p>
                              <p><span className="text-gray-600">Fecha Nacimiento:</span> {formatDate(empleado.fecha_nacimiento)}</p>
                              <p><span className="text-gray-600">Género:</span> {empleado.genero || '-'}</p>
                              <p className="flex items-center gap-2">
                                <Phone size={14} className="text-gray-500" />
                                <span>{formatPhoneChile(empleado.telefono_personal)}</span>
                              </p>
                            </div>
                          </div>

                          {/* Ubicación */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Ubicación</h4>
                            <div className="space-y-2 text-sm">
                              <p className="flex items-center gap-2">
                                <MapPin size={14} className="text-gray-500" />
                                <span>{empleado.ciudad || '-'}</span>
                              </p>
                              <p><span className="text-gray-600">Dirección:</span> {empleado.direccion || '-'}</p>
                            </div>
                          </div>

                          {/* Contacto Emergencia */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Contacto Emergencia</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="text-gray-600">Nombre:</span> {empleado.contacto_emergencia_nombre || '-'}</p>
                              <p><span className="text-gray-600">Teléfono:</span> {formatPhoneChile(empleado.contacto_emergencia_telefono)}</p>
                              <p><span className="text-gray-600">Relación:</span> {empleado.contacto_emergencia_relacion || '-'}</p>
                            </div>
                          </div>

                          {/* Beneficios */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Beneficios Sociales</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="text-gray-600">AFP:</span> {getNombreAfp(empleado.afp_id)}</p>
                              <p><span className="text-gray-600">FONASA:</span> {empleado.tipo_fonasa}</p>
                              <p><span className="text-gray-600">Isapre:</span> {getNombreIsapre(empleado.isapre_id)}</p>
                              <p><span className="text-gray-600">Cesantía:</span> {empleado.numero_seguro_cesantia || '-'}</p>
                            </div>
                          </div>

                          {/* Datos Bancarios */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Datos Bancarios</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="text-gray-600">Banco:</span> {empleado.banco || '-'}</p>
                              <p><span className="text-gray-600">Tipo Cuenta:</span> {empleado.tipo_cuenta || '-'}</p>
                              <p><span className="text-gray-600">Número Cuenta:</span> {empleado.numero_cuenta || '-'}</p>
                            </div>
                          </div>

                          {/* Contrato */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Contrato</h4>
                            <div className="space-y-2 text-sm">
                              <p><span className="text-gray-600">Tipo:</span> {empleado.tipo_contrato}</p>
                              <p><span className="text-gray-600">Termino:</span> {formatDate(empleado.fecha_termino)}</p>
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
        )}
      </div>
    );
  };

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
          <button 
            onClick={() => setError(null)}
            className="float-right text-red-900 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        renderEmpleadosTable()
      )}

      {/* Dialog */}
      <FormDialog
        isOpen={openDialog}
        title={editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        {/* SECCIÓN 1: DATOS LABORALES */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Laborales</h3>
          
          <Select
            label="Filtrar por Rol"
            options={[
              { id: '', label: 'Todos los usuarios' },
              { id: 'admin', label: 'Administradores' },
              { id: 'conductor', label: 'Conductores' },
              { id: 'mecanico', label: 'Mecánicos' },
              { id: 'asistente', label: 'Asistentes' },
              { id: 'rrhh', label: 'RRHH' },
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Auto-rellenado de email y RUT */}
          {(() => {
            const selectedUser = formData.user_id ? usuarios.find(u => u.id === parseInt(formData.user_id)) : null;
            return selectedUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Mail size={16} />
                  Datos del Usuario Seleccionado
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-700 font-medium mb-1">Email</p>
                    <p className="text-sm text-blue-900 font-mono bg-white px-3 py-2 rounded border border-blue-200">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 font-medium mb-1">RUT</p>
                    <p className="text-sm text-blue-900 font-mono bg-white px-3 py-2 rounded border border-blue-200">
                      {selectedUser.rut_completo || `${selectedUser.rut}-${selectedUser.rut_verificador}`}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  
                </p>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de Contrato"
              options={CONTRATOS.map(c => ({ id: c, label: c }))}
              value={formData.tipo_contrato}
              onChange={(e) => setFormData({ ...formData, tipo_contrato: e.target.value })}
              required
            />
            <Input
              label="Fecha de Término (Opcional)"
              type="date"
              value={formData.fecha_termino}
              onChange={(e) => setFormData({ ...formData, fecha_termino: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salario Base (CLP) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="number"
                  value={formData.salario_base}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, salario_base: value === '' ? '' : parseInt(value) || 0 });
                  }}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <Select
              label="Estado"
              options={ESTADOS.map(e => ({ id: e, label: e }))}
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              required
            />
          </div>
        </div>

        {/* SECCIÓN 2: DATOS PERSONALES */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Personales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Nacimiento"
              type="date"
              value={formData.fecha_nacimiento}
              onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Género"
              options={GENEROS}
              value={formData.genero}
              onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Teléfono Personal"
                type="tel"
                value={formData.telefono_personal}
                onChange={(e) => handlePhoneChange('telefono_personal', e.target.value)}
                placeholder="9 7604 6231"
                maxLength="9"
                error={phoneErrors.telefono_personal}
              />
              {formData.telefono_personal && (
                <p className="text-sm text-gray-500 mt-1">
                  Formato: {formatPhoneChile(formData.telefono_personal)}
                </p>
              )}
            </div>
            <Input
              label="Ciudad"
              value={formData.ciudad}
              onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              placeholder="Santiago"
            />
          </div>

          <Input
            label="Dirección"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            placeholder="Calle Principal 123, Depto 4"
          />
        </div>

        {/* SECCIÓN 3: CONTACTO EMERGENCIA */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto de Emergencia</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={formData.contacto_emergencia_nombre}
              onChange={(e) => setFormData({ ...formData, contacto_emergencia_nombre: e.target.value })}
            />
            <Input
              label="Relación"
              value={formData.contacto_emergencia_relacion}
              onChange={(e) => setFormData({ ...formData, contacto_emergencia_relacion: e.target.value })}
              placeholder="Padre, Madre, Cónyuge, etc"
            />
          </div>

          <div>
            <Input
              label="Teléfono"
              type="tel"
              value={formData.contacto_emergencia_telefono}
              onChange={(e) => handlePhoneChange('contacto_emergencia_telefono', e.target.value)}
              placeholder="9 XXXX XXXX"
              maxLength="9"
              error={phoneErrors.contacto_emergencia_telefono}
            />
            {formData.contacto_emergencia_telefono && (
              <p className="text-sm text-gray-500 mt-1">
                Formato: {formatPhoneChile(formData.contacto_emergencia_telefono)}
              </p>
            )}
          </div>
        </div>

        {/* SECCIÓN 4: BENEFICIOS SOCIALES */}
        <div className="border-b pb-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Beneficios Sociales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="AFP"
              options={[{ id: '', label: 'Seleccione AFP' }, ...afps.map(a => ({ id: a.id, label: `${a.nombre} (${a.porcentaje_descuento}%)` }))]}
              value={formData.afp_id}
              onChange={(e) => setFormData({ ...formData, afp_id: e.target.value })}
            />
            <Select
              label="Tramo FONASA"
              options={TRAMOS_FONASA}
              value={formData.tipo_fonasa}
              onChange={(e) => setFormData({ ...formData, tipo_fonasa: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Isapre"
              options={[{ id: '', label: 'Seleccione Isapre o FONASA' }, ...isapres.map(i => ({ id: i.id, label: i.nombre }))]}
              value={formData.isapre_id}
              onChange={(e) => setFormData({ ...formData, isapre_id: e.target.value })}
            />
            <Input
              label="Número Seguro Cesantía"
              value={formData.numero_seguro_cesantia}
              onChange={(e) => setFormData({ ...formData, numero_seguro_cesantia: e.target.value })}
            />
          </div>
        </div>

        {/* SECCIÓN 5: DATOS BANCARIOS */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Bancarios</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Banco"
              value={formData.banco}
              onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
              placeholder="BancoEstado, Itaú, etc"
            />
            <Select
              label="Tipo de Cuenta"
              options={[{ id: '', label: 'Seleccione tipo' }, ...TIPOS_CUENTA]}
              value={formData.tipo_cuenta}
              onChange={(e) => setFormData({ ...formData, tipo_cuenta: e.target.value })}
            />
          </div>

          <Input
            label="Número de Cuenta"
            value={formData.numero_cuenta}
            onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
            placeholder="1234567890"
          />
        </div>
      </FormDialog>
    </div>
  );
}