import React, { useState, useEffect } from 'react';
import { 
  Plus, ChevronDown, ChevronUp, Phone, MapPin, DollarSign, 
  Search, X, Mail, AlertTriangle, Edit2, Trash2, UserX,
  Briefcase, Heart, CreditCard, User, Users, Filter 
} from 'lucide-react';
import FormDialog from '../components/forms/FormDialog';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import { 
  fetchEmpleados, fetchUsers, fetchAfps, fetchIsapres, fetchRoles,
  createEmpleado, updateEmpleado, deleteEmpleado, darDeBajaEmpleado 
} from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';

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

// ==========================================
// UTILIDADES
// ==========================================
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
  // --- ESTADO DE DATOS ---
  const [allEmpleados, setAllEmpleados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [afps, setAfps] = useState([]);
  const [isapres, setIsapres] = useState([]);
  const [roles, setRoles] = useState([]); // Nuevo estado para Roles
  
  // --- ESTADO DE UI Y USUARIO ---
  const [currentUser, setCurrentUser] = useState(null);
  const [searchUsuario, setSearchUsuario] = useState('');
  
  // --- FILTROS PRINCIPALES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState(''); // Nuevo filtro por Rol
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // --- HOOK DE NOTIFICACIONES ---
  const { addNotification } = useNotifications();

  // --- MODALES ---
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [openBajaDialog, setOpenBajaDialog] = useState(false);
  const [empleadoParaBaja, setEmpleadoParaBaja] = useState(null);

  // --- FORMULARIOS ---
  const [bajaFormData, setBajaFormData] = useState({
    fecha_termino: '',
    motivo_termino: 'renuncia',
    observaciones_termino: '',
  });
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
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Agregamos fetchRoles para tener los cargos disponibles
      const [empleadosData, usuariosData, afpsData, isapresData, rolesData] = await Promise.all([
        fetchEmpleados(),
        fetchUsers(),
        fetchAfps(),
        fetchIsapres(),
        fetchRoles(),
      ]);
      setAllEmpleados(empleadosData);
      setUsuarios(usuariosData);
      setAfps(afpsData);
      setIsapres(isapresData);
      setRoles(rolesData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
      addNotification('error', 'Error', 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  const getEmpleadosFiltrados = () => {
    const sortedEmpleados = [...allEmpleados].sort((a, b) => b.id - a.id);

    return sortedEmpleados.filter((empleado) => {
      const user = usuarios.find(u => u.id === empleado.user_id);
      if (!user) return false;

      // 1. Filtro por Búsqueda (Texto)
      const term = searchTerm.toLowerCase().trim();
      const nombreCompleto = `${user.nombre} ${user.apellido}`.toLowerCase();
      const rut = `${user.rut}${user.rut_verificador}`.replace(/\D/g, '');
      const rutFormateado = formatRUT(user.rut, user.rut_verificador).toLowerCase();
      const numeroEmpleado = empleado.numero_empleado?.toLowerCase() || '';
      
      const matchesSearch = !term || (
        nombreCompleto.includes(term) ||
        rut.includes(term) ||
        rutFormateado.includes(term) ||
        numeroEmpleado.includes(term)
      );

      // 2. Filtro por Rol (Cargo)
      const matchesRole = !filterRol || (user.rol_id.toString() === filterRol.toString());

      return matchesSearch && matchesRole;
    });
  };

  const filteredEmpleados = getEmpleadosFiltrados();
  
  const { currentPage, setCurrentPage, totalPages, paginatedData } = usePagination(filteredEmpleados, 10);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterRol]);

  // --- HANDLERS ---
  const handleOpenDialog = (empleado = null) => {
    setPhoneErrors({});
    if (empleado) {
      setEditingEmpleado(empleado);
      setFormData({
        ...empleado,
        user_id: empleado.user_id?.toString() || '',
        fecha_contratacion: empleado.fecha_contratacion ? empleado.fecha_contratacion.split('T')[0] : '',
        fecha_termino: empleado.fecha_termino ? empleado.fecha_termino.split('T')[0] : '',
        fecha_nacimiento: empleado.fecha_nacimiento ? empleado.fecha_nacimiento.split('T')[0] : '',
        tipo_contrato: empleado.tipo_contrato || 'indefinido',
        salario_base: empleado.salario_base || '',
        estado: empleado.estado || 'activo',
      });
    } else {
      setEditingEmpleado(null);
      setFormData({
        user_id: '', numero_empleado: '', fecha_contratacion: '', fecha_termino: '',
        tipo_contrato: 'indefinido', salario_base: '', estado: 'activo', ciudad: '',
        direccion: '', telefono_personal: '', fecha_nacimiento: '', genero: '',
        contacto_emergencia_nombre: '', contacto_emergencia_telefono: '', contacto_emergencia_relacion: '',
        afp_id: '', tipo_fonasa: 'B', isapre_id: '', numero_seguro_cesantia: '',
        banco: '', tipo_cuenta: '', numero_cuenta: '',
      });
    }
    setSearchUsuario('');
    setOpenDialog(true);
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
    if (!formData.user_id || !formData.fecha_contratacion || !formData.salario_base) {
      setError('Por favor complete los campos requeridos (*)');
      return;
    }
    if ((formData.telefono_personal && !isValidPhoneChile(formData.telefono_personal)) || 
        (formData.contacto_emergencia_telefono && !isValidPhoneChile(formData.contacto_emergencia_telefono))) {
      setError('Verifique los números de teléfono');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        user_id: parseInt(formData.user_id),
        salario_base: parseInt(formData.salario_base) || 0
      };
      if (!editingEmpleado) {
        delete dataToSave.numero_empleado;
        delete dataToSave.numero_funcional;
      }

      if (editingEmpleado) {
        await updateEmpleado(editingEmpleado.id, dataToSave);
        addNotification('success', 'Empleado Actualizado', `Se han guardado los cambios para ${getNombreUsuario(dataToSave.user_id)}.`);
      } else {
        await createEmpleado(dataToSave);
        addNotification('success', 'Nuevo Empleado', 'El empleado ha sido registrado exitosamente.');
      }
      loadData();
      handleCloseDialog();
      setError(null);
    } catch (err) {
      addNotification('error', 'Error', 'No se pudo guardar el empleado.');
      setError(err.response?.status === 409 ? 'El número de empleado ya existe' : 'Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este empleado?')) {
      try {
        await deleteEmpleado(id);
        addNotification('warning', 'Empleado Eliminado', 'El registro ha sido eliminado del sistema.');
        loadData();
        setError(null);
      } catch (err) {
        addNotification('error', 'Error', 'No se pudo eliminar el empleado.');
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  // --- FUNCIONES DE BAJA ---
  const handleOpenBajaDialog = (empleado) => {
    setEmpleadoParaBaja(empleado);
    setBajaFormData({
      fecha_termino: new Date().toISOString().split('T')[0],
      motivo_termino: 'renuncia',
      observaciones_termino: '',
    });
    setOpenBajaDialog(true);
  };

  const handleCloseBajaDialog = () => {
    setOpenBajaDialog(false);
    setEmpleadoParaBaja(null);
    setBajaFormData({
      fecha_termino: '',
      motivo_termino: 'renuncia',
      observaciones_termino: '',
    });
  };

  const handleConfirmarBaja = async () => {
    if (!bajaFormData.fecha_termino || !bajaFormData.motivo_termino) {
      setError('Complete los campos de baja');
      return;
    }
    try {
      await darDeBajaEmpleado(empleadoParaBaja.id, bajaFormData);
      addNotification('warning', 'Baja Procesada', `El empleado ${getNombreUsuario(empleadoParaBaja.user_id)} ha sido dado de baja.`);
      loadData();
      handleCloseBajaDialog();
      setError(null);
    } catch (err) {
      addNotification('error', 'Error', 'No se pudo procesar la baja.');
      setError(err.message || 'Error al dar de baja');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilterRol('');
  };

  // --- HELPERS ---
  const canDarDeBaja = () => currentUser && (currentUser.rol_id === 1 || currentUser.rol_id === 6);
  const getNombreUsuario = (userId) => { const u = usuarios.find(u => u.id === userId); return u ? `${u.nombre} ${u.apellido}` : 'N/A'; };
  const getRUTUsuario = (userId) => { const u = usuarios.find(u => u.id === userId); return u ? formatRUT(u.rut, u.rut_verificador) : '-'; };
  const getNombreAfp = (afpId) => afps.find(a => a.id === afpId)?.nombre || '-';
  const getNombreIsapre = (isapreId) => isapres.find(i => i.id === isapreId)?.nombre || '-';
  
  const getUsuariosFiltrados = () => {
    return usuarios.filter(user => {
      const rol = user.rol?.nombre?.toLowerCase() || '';
      const busqueda = searchUsuario.toLowerCase();
      if (busqueda && !rol.includes(busqueda)) return false;
      const yaEsEmpleado = allEmpleados.some(emp => emp.user_id === user.id);
      if (editingEmpleado && user.id === editingEmpleado.user_id) return true;
      return !yaEsEmpleado;
    });
  };

  const getEstadoColor = (estado) => ({
    'activo': 'bg-green-100 text-green-800', 'licencia': 'bg-blue-100 text-blue-800',
    'suspendido': 'bg-orange-100 text-orange-800', 'terminado': 'bg-red-100 text-red-800'
  }[estado] || 'bg-gray-100 text-gray-800');

  // --- TABLA RENDERIZADA ---
  const renderEmpleadosTable = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Usuario</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">RUT</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">N° Empleado</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Cargo</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Contratación</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedData.length === 0 ? (
            <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No se encontraron empleados con los filtros seleccionados</td></tr>
          ) : (
            paginatedData.map((empleado) => (
              <React.Fragment key={empleado.id}>
                <tr 
                  onClick={() => setExpandedRow(expandedRow === empleado.id ? null : empleado.id)}
                  className="hover:bg-gray-100 transition-colors even:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap font-medium">{getNombreUsuario(empleado.user_id)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{getRUTUsuario(empleado.user_id)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{empleado.numero_empleado}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap capitalize">{usuarios.find(u => u.id === empleado.user_id)?.rol?.nombre || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(empleado.fecha_contratacion)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getEstadoColor(empleado.estado)}`}>{empleado.estado}</span>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleOpenDialog(empleado)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors font-medium"><Edit2 size={16} /> Editar</button>
                      {empleado.estado === 'activo' && canDarDeBaja() && (
                        <button onClick={() => handleOpenBajaDialog(empleado)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-50 text-orange-700 border border-orange-200 rounded-md hover:bg-orange-100 hover:border-orange-300 transition-colors font-medium"><UserX size={16} /> Baja</button>
                      )}
                      <button onClick={() => handleDelete(empleado.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors font-medium"><Trash2 size={16} /> Eliminar</button>
                      <button onClick={() => setExpandedRow(expandedRow === empleado.id ? null : empleado.id)} className="flex items-center justify-center w-9 h-9 bg-gray-100 text-gray-600 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors ml-1">
                        {expandedRow === empleado.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === empleado.id && (
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <td colSpan="7" className="px-6 py-6 cursor-default">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2"><User size={16}/> Datos Personales</h4>
                          <p><span className="text-gray-500">Email:</span> {usuarios.find(u => u.id === empleado.user_id)?.email}</p>
                          <p><span className="text-gray-500">F. Nacimiento:</span> {formatDate(empleado.fecha_nacimiento)}</p>
                          <p><span className="text-gray-500">Género:</span> {empleado.genero}</p>
                          <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {formatPhoneChile(empleado.telefono_personal)}</p>
                          <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400"/> {empleado.direccion}, {empleado.ciudad}</p>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2"><Briefcase size={16}/> Contrato & Finanzas</h4>
                          <p><span className="text-gray-500">Tipo Contrato:</span> <span className="capitalize">{empleado.tipo_contrato.replace('_', ' ')}</span></p>
                          <p><span className="text-gray-500">Salario Base:</span> {formatCurrency(empleado.salario_base)}</p>
                          <p><span className="text-gray-500">AFP:</span> {getNombreAfp(empleado.afp_id)}</p>
                          <p><span className="text-gray-500">Salud:</span> {getNombreIsapre(empleado.isapre_id)} ({empleado.tipo_fonasa})</p>
                          <p><span className="text-gray-500">Seg. Cesantía:</span> {empleado.numero_seguro_cesantia || '-'}</p>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 border-b border-gray-300 pb-1 flex items-center gap-2"><Heart size={16}/> Emergencia & Banco</h4>
                          <p><span className="text-gray-500">Contacto:</span> {empleado.contacto_emergencia_nombre}</p>
                          <p><span className="text-gray-500">Relación:</span> {empleado.contacto_emergencia_relacion}</p>
                          <p><span className="text-gray-500">Tel:</span> {formatPhoneChile(empleado.contacto_emergencia_telefono)}</p>
                          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                            <div className="flex items-center gap-2 mb-1"><CreditCard size={14}/> <strong>Datos Bancarios</strong></div>
                            <p>Banco: {empleado.banco}</p>
                            <p>{empleado.tipo_cuenta} • {empleado.numero_cuenta}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Empleados</h1>
            <p className="mt-2 text-slate-300 max-w-xl">Administra los empleados de la empresa.</p>
          </div>
          <Button variant="primary" size="lg" onClick={() => handleOpenDialog()} className="flex items-center gap-2 shadow-lg">
            <Plus size={20} /> Nuevo Empleado
          </Button>
        </div>
        <Users className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* BUSCADOR Y FILTROS UNIFICADOS */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
        
        {/* Buscador de Texto */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, RUT o número de empleado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Filtro por Cargo (Rol) */}
        <div className="w-full md:w-64">
          <div className="relative">
            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white cursor-pointer"
            >
              <option value="">Todos los Cargos</option>
              {roles.map(rol => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Botón Limpiar */}
        {(searchTerm || filterRol) && (
           <button 
             onClick={handleClearSearch}
             className="px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium border border-gray-200"
           >
             Limpiar
           </button>
        )}

      </div>

      {/* Tabla */}
      {loading ? <div className="text-center py-8">Cargando...</div> : renderEmpleadosTable()}

      {/* Paginación */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* MODAL: Formulario Completo */}
      <FormDialog
        isOpen={openDialog}
        title={editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
        onSubmit={handleSave}
        onCancel={handleCloseDialog}
      >
        <div className="space-y-6">
          {/* 1. Usuario */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase">1. Usuario de Sistema</h4>
            <Select
              label="Filtrar por Rol"
              options={[
                { id: '', label: 'Todos' }, { id: 'admin', label: 'Administradores' },
                { id: 'conductor', label: 'Conductores' }, { id: 'mecanico', label: 'Mecánicos' },
                { id: 'asistente', label: 'Asistentes' }, { id: 'rrhh', label: 'RRHH' },{ id: 'gerente', label: 'Gerente' }
              ]}
              value={searchUsuario}
              onChange={(e) => setSearchUsuario(e.target.value)}
            />
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario *</label>
              <select
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={!!editingEmpleado}
              >
                <option value="">Seleccione un usuario...</option>
                {getUsuariosFiltrados().map(u => (
                  <option key={u.id} value={u.id}>{u.nombre} {u.apellido} ({u.rut}-{u.rut_verificador})</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Contrato */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-1">2. Información Contractual</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input label="F. Contratación *" type="date" value={formData.fecha_contratacion} onChange={e => setFormData({...formData, fecha_contratacion: e.target.value})} />
              <Select label="Tipo Contrato *" options={CONTRATOS.map(c => ({ id: c, label: c.replace('_', ' ') }))} value={formData.tipo_contrato} onChange={e => setFormData({...formData, tipo_contrato: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Salario Base *" type="number" value={formData.salario_base} onChange={e => setFormData({...formData, salario_base: e.target.value})} />
              <Select label="Estado *" options={ESTADOS.map(e => ({ id: e, label: e }))} value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} />
            </div>
            <div className="mt-4">
              <Input label="Fecha Término (Opcional)" type="date" value={formData.fecha_termino} onChange={e => setFormData({...formData, fecha_termino: e.target.value})} />
            </div>
          </div>

          {/* 3. Personal */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-1">3. Datos Personales</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input label="F. Nacimiento" type="date" value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} />
              <Select label="Género" options={GENEROS} value={formData.genero} onChange={e => setFormData({...formData, genero: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input label="Teléfono" value={formData.telefono_personal} onChange={e => handlePhoneChange('telefono_personal', e.target.value)} maxLength={9} placeholder="912345678" error={phoneErrors.telefono_personal} />
              <Input label="Ciudad" value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} />
            </div>
            <Input label="Dirección" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
          </div>

          {/* 4. Emergencia */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-1">4. Contacto Emergencia</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input label="Nombre" value={formData.contacto_emergencia_nombre} onChange={e => setFormData({...formData, contacto_emergencia_nombre: e.target.value})} />
              <Input label="Relación" value={formData.contacto_emergencia_relacion} onChange={e => setFormData({...formData, contacto_emergencia_relacion: e.target.value})} />
            </div>
            <Input label="Teléfono Emergencia" value={formData.contacto_emergencia_telefono} onChange={e => handlePhoneChange('contacto_emergencia_telefono', e.target.value)} maxLength={9} error={phoneErrors.contacto_emergencia_telefono} />
          </div>

          {/* 5. Previsión */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-1">5. Previsión y Salud</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select label="AFP" options={[{id:'', label:'Seleccione...'}, ...afps.map(a => ({id:a.id, label:a.nombre}))]} value={formData.afp_id} onChange={e => setFormData({...formData, afp_id: e.target.value})} />
              <Select label="Tramo FONASA" options={TRAMOS_FONASA} value={formData.tipo_fonasa} onChange={e => setFormData({...formData, tipo_fonasa: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Isapre" options={[{id:'', label:'Seleccione...'}, ...isapres.map(i => ({id:i.id, label:i.nombre}))]} value={formData.isapre_id} onChange={e => setFormData({...formData, isapre_id: e.target.value})} />
              <Input label="Seguro Cesantía" value={formData.numero_seguro_cesantia} onChange={e => setFormData({...formData, numero_seguro_cesantia: e.target.value})} />
            </div>
          </div>

          {/* 6. Bancarios */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-1">6. Datos Bancarios</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input label="Banco" value={formData.banco} onChange={e => setFormData({...formData, banco: e.target.value})} />
              <Select label="Tipo Cuenta" options={TIPOS_CUENTA} value={formData.tipo_cuenta} onChange={e => setFormData({...formData, tipo_cuenta: e.target.value})} />
            </div>
            <Input label="Número Cuenta" value={formData.numero_cuenta} onChange={e => setFormData({...formData, numero_cuenta: e.target.value})} />
          </div>
        </div>
      </FormDialog>

      {/* MODAL: Baja */}
      <FormDialog isOpen={openBajaDialog} title="Dar de Baja" onSubmit={handleConfirmarBaja} onCancel={handleCloseBajaDialog}>
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mb-4 flex gap-3">
          <AlertTriangle className="text-yellow-600 shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-bold">¿Confirmar término de contrato?</p>
            <p>El empleado pasará a estado "terminado".</p>
          </div>
        </div>
        <Input label="Fecha Término *" type="date" value={bajaFormData.fecha_termino} onChange={e => setBajaFormData({...bajaFormData, fecha_termino: e.target.value})} required />
        <div className="mt-4">
          <Select label="Motivo" options={[{id:'renuncia', label:'Renuncia'}, {id:'despido', label:'Despido'}, {id:'termino_contrato', label:'Fin Contrato'}]} value={bajaFormData.motivo_termino} onChange={e => setBajaFormData({...bajaFormData, motivo_termino: e.target.value})} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            rows={3}
            value={bajaFormData.observaciones_termino}
            onChange={e => setBajaFormData({...bajaFormData, observaciones_termino: e.target.value})}
          />
        </div>
      </FormDialog>
    </div>
  );
}