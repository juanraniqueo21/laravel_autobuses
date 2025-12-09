import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, Plus, Download, Edit, Trash2, 
  Calendar, FileText, CheckCircle, Calculator, Check, AlertCircle, Search, X, RefreshCw, User
} from 'lucide-react';
import {
  fetchLiquidaciones,
  fetchEmpleados,
  createLiquidacion,
  updateLiquidacion,
  deleteLiquidacion,
  calcularLiquidacion,
  descargarLiquidacionPDF,
  fetchEstadisticasLiquidaciones
} from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import FormDialog from '../components/forms/FormDialog';
import Table from '../components/tables/Table';
import MetricCard from '../components/cards/MetricCard';
// --- IMPORTS ALERTAS ---
import AlertDialog from '../components/common/AlertDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';

const LiquidacionesPage = ({ user }) => {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [filteredLiquidaciones, setFilteredLiquidaciones] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingLiquidacion, setEditingLiquidacion] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [calculando, setCalculando] = useState(false);

  // --- ESTADOS PARA BUSCADOR DE EMPLEADO (Formulario) ---
  const [empleadoSearchTerm, setEmpleadoSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // --- SISTEMA ALERTAS ---
  const [dialogs, setDialogs] = useState({
    alert: { isOpen: false, type: 'success', title: '', message: '' },
    confirm: { isOpen: false, type: 'warning', title: '', message: '', onConfirm: null }
  });
  const showAlert = (type, title, message) =>
    setDialogs(prev => ({ ...prev, alert: { isOpen: true, type, title, message } }));
  const showConfirm = (type, title, message, onConfirm) =>
    setDialogs(prev => ({ ...prev, confirm: { isOpen: true, type, title, message, onConfirm } }));
  const closeAlert = () =>
    setDialogs(prev => ({ ...prev, alert: { ...prev.alert, isOpen: false } }));
  const closeConfirm = () =>
    setDialogs(prev => ({ ...prev, confirm: { ...prev.confirm, isOpen: false } }));
  // ---------------------

  // Filtros Tabla Principal
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [filtros, setFiltros] = useState({
    estado: '',
    anio: new Date().getFullYear(),
    mes: ''
  });

  // Formulario
  const [formData, setFormData] = useState({
    empleado_id: '',
    periodo_desde: '',
    periodo_hasta: '',
    sueldo_base: '',
    descuento_afp: '',
    descuento_isapre: '',
    descuento_seguro_desempleo: '',
    descuento_impuesto_renta: '', // <--- NUEVO CAMPO AGREGADO
    bonificaciones: '',
    horas_extras_valor: '',
    estado: 'procesada',
    fecha_pago: '',
    observaciones: ''
  });

  // Permisos por rol
  const rolId = user?.rol_id || user?.rol?.id;
  const esAdmin = rolId === 1;
  const esRRHH = rolId === 6;
  const esGerente = rolId === 2;
  const puedeEditar = esAdmin || esRRHH;
  const puedeVer = esAdmin || esRRHH || esGerente;

  useEffect(() => {
    if (puedeVer) {
      cargarDatos();
    }
  }, [filtros.estado, filtros.anio, filtros.mes]);

  useEffect(() => {
    aplicarFiltrosLocales();
  }, [liquidaciones, filtroEmpleado]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const empData = await fetchEmpleados();
      setEmpleados(Array.isArray(empData) ? empData : []);

      const liqData = await fetchLiquidaciones(filtros);
      setLiquidaciones(Array.isArray(liqData) ? liqData : []);

      const statsData = await fetchEstadisticasLiquidaciones();
      setEstadisticas(statsData);

    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      showAlert('error', 'Error de Carga', error.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltrosLocales = () => {
    let resultado = [...liquidaciones];

    if (filtroEmpleado) {
      const termino = filtroEmpleado.toLowerCase();
      resultado = resultado.filter((liq) => {
        const nombre = liq.empleado?.user?.nombre?.toLowerCase() || '';
        const apellido = liq.empleado?.user?.apellido?.toLowerCase() || '';
        const rut = liq.empleado?.user?.rut
          ? `${liq.empleado.user.rut}-${liq.empleado.user.rut_verificador}`
          : '';
        
        return nombre.includes(termino) || apellido.includes(termino) || rut.includes(termino);
      });
    }
    setFilteredLiquidaciones(resultado);
  };

  // --- Lógica del Buscador de Empleados en Formulario ---
  const getEmpleadosSugeridos = () => {
    if (!empleadoSearchTerm) return [];
    const term = empleadoSearchTerm.toLowerCase();
    return empleados
      .filter(emp => {
        const nombreCompleto = `${emp.user?.nombre} ${emp.user?.apellido}`.toLowerCase();
        const rut = `${emp.user?.rut}-${emp.user?.rut_verificador}`;
        return nombreCompleto.includes(term) || rut.includes(term);
      })
      .slice(0, 5);
  };

  const seleccionarEmpleado = (empleado) => {
    setEmpleadoSearchTerm(`${empleado.user.nombre} ${empleado.user.apellido}`);
    setShowSuggestions(false);
    handleEmpleadoChange(empleado.id); // Ejecutar la lógica de cálculo original
  };

  // --- Empleado seleccionado => cálculo automático ---
  const handleEmpleadoChange = async (empleadoId) => {
    setFormData(prev => ({ ...prev, empleado_id: empleadoId }));
    if (!empleadoId) return;

    const empleado = empleados.find(e => e.id === parseInt(empleadoId));
    if (!empleado) return;

    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    const periodoDesde = primerDia.toISOString().split('T')[0];
    const periodoHasta = ultimoDia.toISOString().split('T')[0];

    setFormData(prev => ({
      ...prev,
      periodo_desde: periodoDesde,
      periodo_hasta: periodoHasta
    }));

    try {
      setCalculando(true);
      const calculo = await calcularLiquidacion(empleadoId, periodoDesde, periodoHasta);
      
      console.log('✅ Respuesta del backend:', calculo);

      setFormData(prev => ({
        ...prev,
        sueldo_base: calculo.haberes?.sueldo_base || '',
        descuento_afp: calculo.descuentos?.afp?.monto || '',
        descuento_isapre: calculo.descuentos?.salud?.monto || '',
        descuento_seguro_desempleo: calculo.descuentos?.cesantia?.monto || '',
        descuento_impuesto_renta: calculo.descuentos?.impuesto?.monto || 0, // <--- AQUI SE CARGA EL IMPUESTO
        bonificaciones: (
          (calculo.haberes?.gratificacion || 0) + 
          (calculo.haberes?.bono_produccion || 0)
        ) || '',
        horas_extras_valor: 0
      }));
    } catch (error) {
      console.error('❌ Error al calcular automáticamente:', error);
      showAlert('error', 'Error cálculo', error.response?.data?.mensaje || error.message);
    } finally {
      setCalculando(false);
    }
  };

  const handleOpenDialog = (liquidacion = null) => {
    if (!puedeEditar) {
      showAlert('warning', 'Acceso denegado', 'No tiene permisos para crear/editar liquidaciones');
      return;
    }
    if (liquidacion) {
      setEditingLiquidacion(liquidacion);
      
      // Pre-llenar el buscador de empleado
      if (liquidacion.empleado && liquidacion.empleado.user) {
        setEmpleadoSearchTerm(`${liquidacion.empleado.user.nombre} ${liquidacion.empleado.user.apellido}`);
      } else {
        setEmpleadoSearchTerm('');
      }

      setFormData({
        empleado_id: liquidacion.empleado_id,
        periodo_desde: liquidacion.periodo_desde,
        periodo_hasta: liquidacion.periodo_hasta,
        sueldo_base: liquidacion.sueldo_base,
        descuento_afp: liquidacion.descuento_afp,
        descuento_isapre: liquidacion.descuento_isapre,
        descuento_seguro_desempleo: liquidacion.descuento_seguro_desempleo || '',
        descuento_impuesto_renta: liquidacion.descuento_impuesto_renta || 0, // <--- CARGAR AL EDITAR
        bonificaciones: liquidacion.bonificaciones,
        horas_extras_valor: liquidacion.horas_extras_valor,
        estado: liquidacion.estado,
        fecha_pago: liquidacion.fecha_pago || '',
        observaciones: liquidacion.observaciones || ''
      });
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingLiquidacion(null);
    resetForm();
  };

  const resetForm = () => {
    setEmpleadoSearchTerm('');
    setFormData({
      empleado_id: '',
      periodo_desde: '',
      periodo_hasta: '',
      sueldo_base: '',
      descuento_afp: '',
      descuento_isapre: '',
      descuento_seguro_desempleo: '',
      descuento_impuesto_renta: '', // <--- RESETEAR
      bonificaciones: '',
      horas_extras_valor: '',
      estado: 'procesada',
      fecha_pago: '',
      observaciones: ''
    });
  };

  // --- Forzar cálculo automático sobre período ya elegido ---
  const handleCalcularAutomatico = async () => {
    if (!formData.empleado_id || !formData.periodo_desde || !formData.periodo_hasta) {
      showAlert('warning', 'Datos incompletos', 'Debe seleccionar empleado y períodos para calcular');
      return;
    }
    try {
      setCalculando(true);
      const calculo = await calcularLiquidacion(
        formData.empleado_id,
        formData.periodo_desde,
        formData.periodo_hasta
      );
      
      console.log('✅ Cálculo forzado:', calculo);
      
      setFormData(prev => ({
        ...prev,
        sueldo_base: calculo.haberes?.sueldo_base || '',
        descuento_afp: calculo.descuentos?.afp?.monto || '',
        descuento_isapre: calculo.descuentos?.salud?.monto || '',
        descuento_seguro_desempleo: calculo.descuentos?.cesantia?.monto || '',
        descuento_impuesto_renta: calculo.descuentos?.impuesto?.monto || 0, // <--- CARGAR IMPUESTO
        bonificaciones: (
          (calculo.haberes?.gratificacion || 0) + 
          (calculo.haberes?.bono_produccion || 0)
        ) || '',
        horas_extras_valor: 0
      }));
      
      showAlert(
        'success',
        'Cálculo Exitoso',
        `Líquido a pagar: ${formatCurrency(calculo.totales?.sueldo_liquido || 0)}`
      );
    } catch (error) {
      showAlert('error', 'Error cálculo', error.response?.data?.mensaje || error.message);
    } finally {
      setCalculando(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!puedeEditar) return showAlert('warning', 'Sin permiso', 'No tiene permisos');
    if (
      !formData.empleado_id ||
      !formData.periodo_desde ||
      !formData.periodo_hasta ||
      !formData.sueldo_base
    ) {
      return showAlert('error', 'Faltan datos', 'Complete todos los campos obligatorios');
    }

    const action = editingLiquidacion ? 'Actualizar' : 'Generar';
    showConfirm(
      'info',
      `¿${action} Liquidación?`,
      `Estás a punto de ${action.toLowerCase()} esta liquidación.`,
      async () => {
        try {
          const liquido = calcularLiquido();
          const dataToSend = {
            ...formData,
            sueldo_base: parseInt(formData.sueldo_base) || 0,
            descuento_afp: parseInt(formData.descuento_afp) || 0,
            descuento_isapre: parseInt(formData.descuento_isapre) || 0,
            descuento_seguro_desempleo: parseInt(formData.descuento_seguro_desempleo) || 0,
            descuento_impuesto_renta: parseInt(formData.descuento_impuesto_renta) || 0,
            bonificaciones: parseInt(formData.bonificaciones) || 0,
            horas_extras_valor: parseInt(formData.horas_extras_valor) || 0,
            sueldo_liquido: liquido,
            otros_descuentos: 0
          };

          if (editingLiquidacion) {
            await updateLiquidacion(editingLiquidacion.id, dataToSend);
            showAlert('success', 'Actualizado', 'Liquidación actualizada exitosamente');
          } else {
            await createLiquidacion(dataToSend);
            showAlert('success', 'Creado', 'Liquidación creada exitosamente');
          }
          handleCloseDialog();
          cargarDatos();
        } catch (error) {
          showAlert('error', 'Error al guardar', error.message);
        }
      }
    );
  };

  const handleDelete = (id) => {
    if (!puedeEditar) return showAlert('warning', 'Sin permiso', 'No tiene permisos');
    
    showConfirm(
      'danger',
      '¿Eliminar Liquidación?',
      'Esta acción eliminará permanentemente la liquidación. ¿Seguro?',
      async () => {
        try {
          await deleteLiquidacion(id);
          showAlert('success', 'Eliminado', 'Liquidación eliminada exitosamente');
          cargarDatos();
        } catch (error) {
          showAlert('error', 'Error al eliminar', error.message);
        }
      }
    );
  };

  const handleMarcarComoPagada = (liquidacion) => {
    if (!puedeEditar) return showAlert('warning', 'Sin permiso', 'No tiene permisos');
    
    showConfirm(
      'success',
      '¿Marcar como PAGADA?',
      'Se cambiará el estado a "Pagada" con fecha de hoy.',
      async () => {
        try {
          const hoy = new Date().toISOString().split('T')[0];
          await updateLiquidacion(liquidacion.id, {
            ...liquidacion,
            estado: 'pagada',
            fecha_pago: hoy
          });
          showAlert('success', 'Pagada', 'Liquidación marcada como PAGADA');
          cargarDatos();
        } catch (error) {
          showAlert('error', 'Error', error.message);
        }
      }
    );
  };

  const handleDescargarPDF = async (id) => {
    try {
      await descargarLiquidacionPDF(id);
    } catch (error) {
      showAlert('error', 'Error PDF', 'Error al descargar PDF');
    }
  };

  // --- CÁLCULO EN TIEMPO REAL DEL LÍQUIDO EN FORMULARIO ---
  const calcularLiquido = () => {
    const haberes = (parseInt(formData.sueldo_base) || 0) +
                    (parseInt(formData.bonificaciones) || 0) +
                    (parseInt(formData.horas_extras_valor) || 0);

    const descuentos = (parseInt(formData.descuento_afp) || 0) +
                       (parseInt(formData.descuento_isapre) || 0) +
                       (parseInt(formData.descuento_seguro_desempleo) || 0) +
                       (parseInt(formData.descuento_impuesto_renta) || 0); // <--- RESTAR IMPUESTO

    return haberes - descuentos;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      borrador: 'bg-gray-100 text-gray-700',
      procesada: 'bg-yellow-100 text-yellow-700',
      pagada: 'bg-green-100 text-green-700',
      cancelada: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[estado] || badges.borrador}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const columns = [
    { 
      key: 'numero_comprobante', 
      label: 'N° Comprobante',
      render: (item) => <span className="font-mono text-gray-600">{item.numero_comprobante || '-'}</span>
    },
    { 
      key: 'empleado', 
      label: 'Empleado',
      render: (item) => {
        if (item.empleado?.user) {
          return (
            <div>
              <div className="font-medium text-gray-900">
                {item.empleado.user.nombre} {item.empleado.user.apellido}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {item.empleado.numero_empleado || '-'}
              </div>
            </div>
          );
        }
        return '-';
      }
    },
    { 
      key: 'periodo', 
      label: 'Período',
      render: (item) => {
        try {
          const desde = new Date(item.periodo_desde).toLocaleDateString('es-CL');
          const hasta = new Date(item.periodo_hasta).toLocaleDateString('es-CL');
          return <span className="text-sm text-gray-600">{desde} - {hasta}</span>;
        } catch { return '-'; }
      }
    },
    { 
      key: 'sueldo_liquido', 
      label: 'Líquido',
      render: (item) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(item.sueldo_liquido)}
        </span>
      )
    },
    { 
      key: 'estado', 
      label: 'Estado',
      render: (item) => getEstadoBadge(item.estado)
    },
    { 
      key: 'fecha_pago', 
      label: 'Fecha Pago',
      render: (item) => {
        if (!item.fecha_pago) return '-';
        try {
          return (
            <span className="text-sm text-gray-600">
              {new Date(item.fecha_pago).toLocaleDateString('es-CL')}
            </span>
          );
        } catch { return '-'; }
      }
    },
    {
      label: 'Acciones',
      key: 'acciones',
      render: (item) => (
        <div className="flex gap-1 justify-center">
          <button 
            onClick={() => handleDescargarPDF(item.id)}
            className="p-1.5 text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
            title="Ver PDF"
          >
            <Download size={16} />
          </button>

          {puedeEditar && item.estado === 'procesada' && (
            <button 
              onClick={() => handleMarcarComoPagada(item)}
              className="p-1.5 text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
              title="Marcar como Pagada"
            >
              <Check size={16} />
            </button>
          )}

          {puedeEditar && item.estado !== 'pagada' && (
            <button 
              onClick={() => handleOpenDialog(item)}
              className="p-1.5 text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
              title="Editar"
            >
              <Edit size={16} />
            </button>
          )}

          {puedeEditar && (
            <button 
              onClick={() => handleDelete(item.id)}
              className="p-1.5 text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  if (!puedeVer) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-red-800">Acceso Restringido</h3>
          <p className="text-red-600 mt-2">No tiene permisos para acceder a este módulo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Alertas / Confirmaciones */}
      <AlertDialog
        isOpen={dialogs.alert.isOpen}
        type={dialogs.alert.type}
        title={dialogs.alert.title}
        message={dialogs.alert.message}
        onClose={closeAlert}
      />
      <ConfirmDialog
        isOpen={dialogs.confirm.isOpen}
        type={dialogs.confirm.type}
        title={dialogs.confirm.title}
        message={dialogs.confirm.message}
        onConfirm={() => {
          if (dialogs.confirm.onConfirm) dialogs.confirm.onConfirm();
          closeConfirm();
        }}
        onCancel={closeConfirm}
      />

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Liquidaciones de Sueldo</h1>
            <p className="mt-2 text-slate-300 max-w-xl">
              {esGerente ? 'Consulta de liquidaciones' : 'Gestión de liquidaciones y nómina'}
            </p>
          </div>
          
          {puedeEditar && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleOpenDialog()}
              className="flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Nueva Liquidación
            </Button>
          )}
        </div>
        <DollarSign className="absolute right-6 bottom-[-20px] h-40 w-40 text-white/5 rotate-12" />
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Liquidaciones"
            value={estadisticas.total_liquidaciones || 0}
            icon={FileText}
            color="blue"
          />
          <MetricCard
            title="Liquidaciones del Mes"
            value={estadisticas.liquidaciones_mes || 0}
            icon={Calendar}
            color="green"
          />
          <MetricCard
            title="Pagadas"
            value={estadisticas.liquidaciones_pagadas || 0}
            icon={CheckCircle}
            color="emerald"
          />
          <MetricCard
            title="Monto Pagado (Mes)"
            value={formatCurrency(estadisticas.monto_total_pagado_mes || 0)}
            icon={DollarSign}
            color="purple"
          />
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda por empleado */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                Buscar Empleado
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Nombre o RUT..."
                  value={filtroEmpleado}
                  onChange={(e) => setFiltroEmpleado(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {filtroEmpleado && (
                  <button 
                    onClick={() => setFiltroEmpleado('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <Select
              label="Estado"
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              options={[
                { id: '', label: 'Todos los estados' },
                { id: 'borrador', label: 'Borrador' },
                { id: 'procesada', label: 'Procesada' },
                { id: 'pagada', label: 'Pagada' },
                { id: 'cancelada', label: 'Cancelada' },
              ]}
            />

            <Input
              label="Año"
              type="number"
              value={filtros.anio}
              onChange={(e) => setFiltros({ ...filtros, anio: e.target.value })}
            />

            <Select
              label="Mes"
              value={filtros.mes}
              onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}
              options={[
                { id: '', label: 'Todos los meses' },
                { id: '1', label: 'Enero' },
                { id: '2', label: 'Febrero' },
                { id: '3', label: 'Marzo' },
                { id: '4', label: 'Abril' },
                { id: '5', label: 'Mayo' },
                { id: '6', label: 'Junio' },
                { id: '7', label: 'Julio' },
                { id: '8', label: 'Agosto' },
                { id: '9', label: 'Septiembre' },
                { id: '10', label: 'Octubre' },
                { id: '11', label: 'Noviembre' },
                { id: '12', label: 'Diciembre' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={filteredLiquidaciones}
        loading={loading}
        emptyMessage="No se encontraron liquidaciones con los filtros seleccionados"
      />

      {/* Dialog Formulario */}
      {showDialog && (
        <FormDialog
          title={editingLiquidacion ? 'Editar Liquidación' : 'Nueva Liquidación'}
          isOpen={showDialog}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          size="large"
        >
          <div className="space-y-6">
            {/* Datos Básicos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">
                Datos Básicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* --- BUSCADOR DE EMPLEADO (AUTOCOMPLETADO) --- */}
                <div className="space-y-1 relative" ref={suggestionsRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar Empleado *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-9"
                      placeholder="Escriba nombre o RUT..."
                      value={empleadoSearchTerm}
                      onChange={(e) => {
                        setEmpleadoSearchTerm(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      disabled={!!editingLiquidacion} // No cambiar empleado al editar
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    {empleadoSearchTerm && !editingLiquidacion && (
                      <button 
                        type="button"
                        onClick={() => {
                          setEmpleadoSearchTerm('');
                          setFormData(prev => ({ ...prev, empleado_id: '' }));
                        }}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Lista de sugerencias */}
                  {showSuggestions && !editingLiquidacion && empleadoSearchTerm && (
                    <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                      {getEmpleadosSugeridos().length > 0 ? (
                        getEmpleadosSugeridos().map(emp => (
                          <li 
                            key={emp.id}
                            onClick={() => seleccionarEmpleado(emp)}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 flex items-center gap-3"
                          >
                            <div className="bg-blue-100 p-1.5 rounded-full text-blue-600">
                              <User size={16} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">
                                {emp.user?.nombre} {emp.user?.apellido}
                              </div>
                              <div className="text-xs text-gray-500">
                                RUT: {emp.user?.rut}-{emp.user?.rut_verificador}
                              </div>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-3 text-sm text-gray-400 text-center">
                          No se encontraron empleados
                        </li>
                      )}
                    </ul>
                  )}

                  {calculando && (
                    <p className="text-xs text-blue-600 mt-1 animate-pulse">
                      ⏳ Calculando automáticamente...
                    </p>
                  )}
                </div>

                <Select
                  label="Estado *"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  options={[
                    { id: 'borrador', label: 'Borrador' },
                    { id: 'procesada', label: 'Procesada' },
                    { id: 'pagada', label: 'Pagada' },
                    { id: 'cancelada', label: 'Cancelada' },
                  ]}
                  required
                />

                <Input
                  label="Período Desde *"
                  type="date"
                  value={formData.periodo_desde}
                  onChange={(e) => setFormData({ ...formData, periodo_desde: e.target.value })}
                  required
                />

                <Input
                  label="Período Hasta *"
                  type="date"
                  value={formData.periodo_hasta}
                  onChange={(e) => setFormData({ ...formData, periodo_hasta: e.target.value })}
                  required
                />

                {formData.estado === 'pagada' && (
                  <Input
                    label="Fecha de Pago"
                    type="date"
                    value={formData.fecha_pago}
                    onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                  />
                )}
              </div>

              {!editingLiquidacion && (
                <div className="mt-4">
                  <Button 
                    type="button" 
                    onClick={handleCalcularAutomatico}
                    variant="secondary"
                    disabled={
                      calculando ||
                      !formData.empleado_id ||
                      !formData.periodo_desde ||
                      !formData.periodo_hasta
                    }
                    className="w-full flex items-center justify-center gap-2 border-dashed border-2"
                  >
                    <Calculator size={18} />
                    {calculando ? 'Calculando...' : 'Forzar Recálculo'}
                  </Button>
                </div>
              )}
            </div>

            {/* Haberes */}
            <div>
              <h3 className="text-lg font-semibold text-green-700 border-b border-green-200 pb-2 mb-4">
                Haberes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Sueldo Base (CLP) *"
                  type="number"
                  value={formData.sueldo_base}
                  onChange={(e) => setFormData({ ...formData, sueldo_base: e.target.value })}
                  required
                />

                <Input
                  label="Bonificaciones (Gratificación + Bonos) (CLP)"
                  type="number"
                  value={formData.bonificaciones}
                  onChange={(e) => setFormData({ ...formData, bonificaciones: e.target.value })}
                  placeholder="0"
                />

                <Input
                  label="Horas Extras (CLP)"
                  type="number"
                  value={formData.horas_extras_valor}
                  onChange={(e) => setFormData({ ...formData, horas_extras_valor: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Descuentos */}
            <div>
              <h3 className="text-lg font-semibold text-red-700 border-b border-red-200 pb-2 mb-4">
                Descuentos Legales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Descuento AFP (CLP)"
                  type="number"
                  value={formData.descuento_afp}
                  onChange={(e) => setFormData({ ...formData, descuento_afp: e.target.value })}
                  placeholder="Automático"
                />

                <Input
                  label="Descuento Isapre/Fonasa (CLP)"
                  type="number"
                  value={formData.descuento_isapre}
                  onChange={(e) => setFormData({ ...formData, descuento_isapre: e.target.value })}
                  placeholder="Automático"
                />

                <Input
                  label="Descuento Seguro Cesantía (CLP)"
                  type="number"
                  value={formData.descuento_seguro_desempleo}
                  onChange={(e) => setFormData({ ...formData, descuento_seguro_desempleo: e.target.value })}
                  placeholder="Automático"
                />

                <Input
                  label="Impuesto Único 2da Categoría (CLP)"
                  type="number"
                  value={formData.descuento_impuesto_renta}
                  onChange={(e) => setFormData({ ...formData, descuento_impuesto_renta: e.target.value })}
                  placeholder="Automático (Si aplica)"
                  className="bg-red-50 border-red-200 text-red-700"
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 italic">
                * Al seleccionar un empleado, todos los descuentos (incluido el Impuesto Único) se calculan automáticamente.
              </div>
            </div>

            {/* Panel de desglose */}
            {formData.sueldo_base && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Calculator size={16} />
                  Desglose del Cálculo Automático
                </h4>
                
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {/* Haberes */}
                  <div className="bg-white rounded p-3 border border-blue-100">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Haberes</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sueldo Base:</span>
                        <span className="font-semibold">{formatCurrency(formData.sueldo_base)}</span>
                      </div>
                      
                      {formData.bonificaciones > 0 && (
                        <>
                          <div className="flex justify-between text-green-600 text-xs">
                            <span>• Gratificación (25%):</span>
                            <span className="font-medium">
                              +{formatCurrency(Math.min(parseInt(formData.sueldo_base) * 0.25, 209396))}
                            </span>
                          </div>
                          <div className="flex justify-between text-green-600 text-xs">
                            <span>• Bono Productividad:</span>
                            <span className="font-medium">
                              +{formatCurrency(
                                Math.max(
                                  0,
                                  parseInt(formData.bonificaciones) -
                                  Math.min(parseInt(formData.sueldo_base) * 0.25, 209396)
                                )
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-green-700 font-bold border-t pt-1">
                            <span>Total Bonos:</span>
                            <span>+{formatCurrency(formData.bonificaciones)}</span>
                          </div>
                        </>
                      )}
                      
                      {formData.horas_extras_valor > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Horas Extras:</span>
                          <span className="font-semibold">
                            +{formatCurrency(formData.horas_extras_valor)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Descuentos */}
                  <div className="bg-white rounded p-3 border border-blue-100">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Descuentos</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-red-600">
                        <span>AFP:</span>
                        <span className="font-semibold">
                          -{formatCurrency(formData.descuento_afp)}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Salud:</span>
                        <span className="font-semibold">
                          -{formatCurrency(formData.descuento_isapre)}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Cesantía:</span>
                        <span className="font-semibold">
                          -{formatCurrency(formData.descuento_seguro_desempleo)}
                        </span>
                      </div>
                      {parseInt(formData.descuento_impuesto_renta) > 0 && (
                        <div className="flex justify-between text-red-800 font-bold border-t border-red-100 pt-1 mt-1">
                          <span>Impuesto:</span>
                          <span>-{formatCurrency(formData.descuento_impuesto_renta)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total líquido */}
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded p-3 text-white">
                    <p className="text-xs font-bold uppercase mb-2 opacity-90">
                      Líquido a Pagar
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(calcularLiquido())}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-800">
                  💡 <strong>Nota:</strong> Los descuentos incluyen AFP (10% + Comisión),
                  Salud (7%), Cesantía (0.6%) e <strong>Impuesto Único</strong> según tabla SII.
                </div>
              </div>
            )}

            {/* Resumen líquido */}
            <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center border border-gray-300">
              <span className="text-lg font-bold text-gray-700">LÍQUIDO A PAGAR:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(calcularLiquido())}
              </span>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Observaciones adicionales sobre esta liquidación..."
              />
            </div>
          </div>
        </FormDialog>
      )}
    </div>
  );
};

export default LiquidacionesPage;
