import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, Filter, Download, Edit, Trash2, 
  Calendar, FileText, CheckCircle, Calculator, Check 
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

const LiquidacionesPage = ({ user }) => {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingLiquidacion, setEditingLiquidacion] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [calculando, setCalculando] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    empleado_id: '',
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
    bonificaciones: '',
    horas_extras_valor: '',
    estado: 'procesada', // 🟢 ESTADO POR DEFECTO: PROCESADA
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
  }, [filtros]);

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
      alert('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 NUEVA FUNCIÓN: Autocompletar al seleccionar empleado
  const handleEmpleadoChange = async (empleadoId) => {
    setFormData(prev => ({ ...prev, empleado_id: empleadoId }));

    if (!empleadoId) return;

    // Buscar empleado seleccionado
    const empleado = empleados.find(e => e.id === parseInt(empleadoId));
    if (!empleado) return;

    // Calcular períodos (mes actual)
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    const periodoDesde = primerDia.toISOString().split('T')[0];
    const periodoHasta = ultimoDia.toISOString().split('T')[0];

    // Actualizar formulario con períodos
    setFormData(prev => ({
      ...prev,
      periodo_desde: periodoDesde,
      periodo_hasta: periodoHasta
    }));

    // Calcular automáticamente
    try {
      setCalculando(true);
      const calculo = await calcularLiquidacion(empleadoId, periodoDesde, periodoHasta);

      setFormData(prev => ({
        ...prev,
        sueldo_base: calculo.sueldo_base || '',
        descuento_afp: calculo.descuento_afp || '',
        descuento_isapre: calculo.descuento_isapre || '',
        bonificaciones: calculo.bonificaciones || '',
        horas_extras_valor: calculo.horas_extras_valor || ''
      }));

    } catch (error) {
      console.error('❌ Error al calcular automáticamente:', error);
    } finally {
      setCalculando(false);
    }
  };

  const handleOpenDialog = (liquidacion = null) => {
    if (!puedeEditar) {
      alert('No tiene permisos para crear/editar liquidaciones');
      return;
    }

    if (liquidacion) {
      setEditingLiquidacion(liquidacion);
      setFormData({
        empleado_id: liquidacion.empleado_id,
        periodo_desde: liquidacion.periodo_desde,
        periodo_hasta: liquidacion.periodo_hasta,
        sueldo_base: liquidacion.sueldo_base,
        descuento_afp: liquidacion.descuento_afp,
        descuento_isapre: liquidacion.descuento_isapre,
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
    setFormData({
      empleado_id: '',
      periodo_desde: '',
      periodo_hasta: '',
      sueldo_base: '',
      descuento_afp: '',
      descuento_isapre: '',
      bonificaciones: '',
      horas_extras_valor: '',
      estado: 'procesada', // 🟢 ESTADO POR DEFECTO: PROCESADA
      fecha_pago: '',
      observaciones: ''
    });
  };

  const handleCalcularAutomatico = async () => {
    if (!formData.empleado_id || !formData.periodo_desde || !formData.periodo_hasta) {
      alert('Debe seleccionar empleado y períodos para calcular');
      return;
    }

    try {
      setCalculando(true);
      const calculo = await calcularLiquidacion(
        formData.empleado_id,
        formData.periodo_desde,
        formData.periodo_hasta
      );

      setFormData(prev => ({
        ...prev,
        sueldo_base: calculo.sueldo_base || '',
        descuento_afp: calculo.descuento_afp || '',
        descuento_isapre: calculo.descuento_isapre || '',
        bonificaciones: calculo.bonificaciones || '',
        horas_extras_valor: calculo.horas_extras_valor || ''
      }));

      alert('✅ Cálculo realizado. Los descuentos de AFP e Isapre/Fonasa se calcularon automáticamente.');
    } catch (error) {
      console.error('❌ Error al calcular:', error);
      alert('Error al calcular liquidación: ' + error.message);
    } finally {
      setCalculando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!puedeEditar) {
      alert('No tiene permisos para guardar liquidaciones');
      return;
    }

    if (!formData.empleado_id || !formData.periodo_desde || !formData.periodo_hasta || !formData.sueldo_base) {
      alert('Complete todos los campos obligatorios');
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        sueldo_base: parseInt(formData.sueldo_base) || 0,
        descuento_afp: parseInt(formData.descuento_afp) || 0,
        descuento_isapre: parseInt(formData.descuento_isapre) || 0,
        bonificaciones: parseInt(formData.bonificaciones) || 0,
        horas_extras_valor: parseInt(formData.horas_extras_valor) || 0,
        descuento_impuesto_renta: 0,
        descuento_seguro_desempleo: 0,
        otros_descuentos: 0
      };

      if (editingLiquidacion) {
        await updateLiquidacion(editingLiquidacion.id, dataToSend);
        alert('✅ Liquidación actualizada exitosamente');
      } else {
        await createLiquidacion(dataToSend);
        alert('✅ Liquidación creada exitosamente');
      }

      handleCloseDialog();
      cargarDatos();
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      alert(error.message || 'Error al guardar liquidación');
    }
  };

  const handleDelete = async (id) => {
    if (!puedeEditar) {
      alert('No tiene permisos para eliminar liquidaciones');
      return;
    }

    // Buscar la liquidación para mostrar información en la confirmación
    const liquidacion = liquidaciones.find(l => l.id === id);
    const estado = liquidacion?.estado || 'desconocido';
    
    // Mensaje de confirmación según el estado
    let mensaje = '¿Está seguro de eliminar esta liquidación?';
    
    if (estado === 'pagada') {
      mensaje = '⚠️ ADVERTENCIA: Esta liquidación ya fue PAGADA.\n\n' +
                '¿Está completamente seguro de eliminarla?\n' +
                'Esta acción no se puede deshacer.';
    } else if (estado === 'procesada') {
      mensaje = '⚠️ Esta liquidación está PROCESADA.\n\n' +
                '¿Está seguro de eliminarla?';
    }

    if (!window.confirm(mensaje)) {
      return;
    }

    // Confirmación adicional para liquidaciones pagadas
    if (estado === 'pagada') {
      const confirmacionFinal = window.confirm(
        '🔴 ÚLTIMA CONFIRMACIÓN\n\n' +
        'Va a eliminar una liquidación PAGADA.\n' +
        'Esto afectará los registros contables.\n\n' +
        '¿Confirma la eliminación?'
      );
      
      if (!confirmacionFinal) {
        return;
      }
    }

    try {
      await deleteLiquidacion(id);
      alert('✅ Liquidación eliminada exitosamente');
      cargarDatos();
    } catch (error) {
      console.error('❌ Error al eliminar:', error);
      alert(error.message || 'Error al eliminar liquidación');
    }
  };

  // 🟢 NUEVA FUNCIÓN: Marcar como pagada directamente desde la tabla
  const handleMarcarComoPagada = async (liquidacion) => {
    if (!puedeEditar) {
      alert('No tiene permisos para cambiar estados');
      return;
    }

    if (!window.confirm('¿Marcar esta liquidación como PAGADA?')) {
      return;
    }

    try {
      const hoy = new Date().toISOString().split('T')[0];
      
      await updateLiquidacion(liquidacion.id, {
        ...liquidacion,
        estado: 'pagada',
        fecha_pago: hoy
      });

      alert('✅ Liquidación marcada como PAGADA');
      cargarDatos();
    } catch (error) {
      console.error('❌ Error al marcar como pagada:', error);
      alert(error.message || 'Error al cambiar estado');
    }
  };

  const handleDescargarPDF = async (id) => {
    try {
      await descargarLiquidacionPDF(id);
    } catch (error) {
      console.error('❌ Error al descargar PDF:', error);
      alert('Error al descargar PDF');
    }
  };

  const calcularLiquido = () => {
    const haberes = (parseInt(formData.sueldo_base) || 0) +
                   (parseInt(formData.bonificaciones) || 0) +
                   (parseInt(formData.horas_extras_valor) || 0);

    const descuentos = (parseInt(formData.descuento_afp) || 0) +
                      (parseInt(formData.descuento_isapre) || 0);

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
      render: (item) => item.numero_comprobante || '-'
    },
    { 
      key: 'empleado', 
      label: 'Empleado',
      render: (item) => {
        if (item.empleado?.user) {
          return `${item.empleado.user.nombre} ${item.empleado.user.apellido}`;
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
          return `${desde} - ${hasta}`;
        } catch {
          return '-';
        }
      }
    },
    { 
      key: 'sueldo_liquido', 
      label: 'Líquido',
      render: (item) => formatCurrency(item.sueldo_liquido)
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
          return new Date(item.fecha_pago).toLocaleDateString('es-CL');
        } catch {
          return '-';
        }
      }
    }
  ];

  const actions = [
    {
      label: 'Ver PDF',
      icon: Download,
      onClick: (item) => handleDescargarPDF(item.id),
      variant: 'primary'
    },
    // 🟢 BOTÓN: Marcar como Pagada (solo para procesadas)
    ...(puedeEditar ? [{
      label: 'Marcar Pagada',
      icon: Check,
      onClick: (item) => handleMarcarComoPagada(item),
      variant: 'success',
      show: (item) => item.estado === 'procesada'
    }] : []),
    ...(puedeEditar ? [{
      label: 'Editar',
      icon: Edit,
      onClick: (item) => handleOpenDialog(item),
      variant: 'secondary',
      show: (item) => item.estado !== 'pagada'
    }] : []),
    // 🟢 BOTÓN: Eliminar (para todas las liquidaciones, con confirmación extra)
    ...(puedeEditar ? [{
      label: 'Eliminar',
      icon: Trash2,
      onClick: (item) => handleDelete(item.id),
      variant: 'danger'
    }] : [])
  ];

  if (!puedeVer) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">No tiene permisos para acceder a este módulo.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="text-blue-600" size={32} />
            Liquidaciones de Sueldo
          </h1>
          <p className="text-gray-600 mt-1">
            {esGerente ? 'Consulta de liquidaciones' : 'Gestión de liquidaciones y nómina'}
          </p>
        </div>

        {puedeEditar && (
          <Button onClick={() => handleOpenDialog()} variant="primary">
            <Plus size={20} />
            Nueva Liquidación
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Empleado"
            value={filtros.empleado_id}
            onChange={(e) => setFiltros({ ...filtros, empleado_id: e.target.value })}
          >
            <option value="">Todos los empleados</option>
            {empleados.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.user?.nombre} {emp.user?.apellido}
              </option>
            ))}
          </Select>

          <Select
            label="Estado"
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          >
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="procesada">Procesada</option>
            <option value="pagada">Pagada</option>
            <option value="cancelada">Cancelada</option>
          </Select>

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
          >
            <option value="">Todos los meses</option>
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow">
        <Table
          columns={columns}
          data={liquidaciones}
          actions={actions}
        />
      </div>

      {/* Dialog Formulario */}
      {showDialog && (
        <FormDialog
          title={editingLiquidacion ? 'Editar Liquidación' : 'Nueva Liquidación'}
          isOpen={showDialog}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            {/* Datos básicos */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Datos Básicos</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select de Empleado - 🟢 CON AUTOCOMPLETADO */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empleado <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.empleado_id}
                    onChange={(e) => handleEmpleadoChange(e.target.value)}
                    required
                    disabled={editingLiquidacion}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Seleccione empleado</option>
                    {empleados.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user?.nombre} {emp.user?.apellido} - {emp.numero_empleado}
                      </option>
                    ))}
                  </select>
                  {calculando && (
                    <p className="text-xs text-blue-600 mt-1">
                      ⏳ Calculando automáticamente...
                    </p>
                  )}
                </div>

                {/* Select de Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="procesada">Procesada</option>
                    <option value="pagada">Pagada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <Input
                  label="Período Desde"
                  type="date"
                  value={formData.periodo_desde}
                  onChange={(e) => setFormData({ ...formData, periodo_desde: e.target.value })}
                  required
                />

                <Input
                  label="Período Hasta"
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
                    disabled={calculando || !formData.empleado_id || !formData.periodo_desde || !formData.periodo_hasta}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Calculator size={18} />
                    {calculando ? 'Calculando...' : 'Recalcular'}
                  </Button>
                </div>
              )}
            </div>

            {/* Haberes */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">Haberes</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Sueldo Base (CLP)"
                  type="number"
                  value={formData.sueldo_base}
                  onChange={(e) => setFormData({ ...formData, sueldo_base: e.target.value })}
                  required
                />

                <Input
                  label="Bonificaciones (CLP)"
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

            {/* Descuentos Legales */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-3">Descuentos Legales</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Descuento AFP (CLP)"
                  type="number"
                  value={formData.descuento_afp}
                  onChange={(e) => setFormData({ ...formData, descuento_afp: e.target.value })}
                  placeholder="Se calcula automáticamente"
                />

                <Input
                  label="Descuento Isapre/Fonasa (CLP)"
                  type="number"
                  value={formData.descuento_isapre}
                  onChange={(e) => setFormData({ ...formData, descuento_isapre: e.target.value })}
                  placeholder="Se calcula automáticamente"
                />
              </div>

              <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-700">
                  <strong>ℹ️ Información:</strong> Al seleccionar un empleado, los descuentos de AFP e Isapre/Fonasa 
                  se calculan automáticamente. Los períodos se autocompletarán con el mes actual.
                </p>
              </div>
            </div>

            {/* Líquido a Pagar */}
            <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-blue-900">LÍQUIDO A PAGAR:</span>
                <span className="text-2xl font-bold text-blue-900">
                  {formatCurrency(calcularLiquido())}
                </span>
              </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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