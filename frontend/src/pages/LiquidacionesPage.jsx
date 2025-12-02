import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, Filter, Download, Edit, Trash2, 
  Calendar, FileText, CheckCircle, Calculator, Check, AlertCircle, Search, X
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
  const [filteredLiquidaciones, setFilteredLiquidaciones] = useState([]); // Nuevo estado para datos filtrados
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingLiquidacion, setEditingLiquidacion] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [calculando, setCalculando] = useState(false);

  // Filtros
  const [filtroEmpleado, setFiltroEmpleado] = useState(''); // Ahora es texto de búsqueda
  const [filtros, setFiltros] = useState({
    // empleado_id ya no se usa aquí para el filtro visual
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

  // Carga inicial de datos
  useEffect(() => {
    if (puedeVer) {
      cargarDatos();
    }
  }, [filtros.estado, filtros.anio, filtros.mes]); // Recargar si cambian estos filtros

  // Efecto para filtrado en cliente (por nombre/RUT)
  useEffect(() => {
    aplicarFiltrosLocales();
  }, [liquidaciones, filtroEmpleado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const empData = await fetchEmpleados();
      setEmpleados(Array.isArray(empData) ? empData : []);

      // Enviamos filtros al backend (excepto empleado, que filtraremos localmente o aparte si el backend lo soporta)
      // Nota: Si el backend soporta búsqueda parcial por nombre, se podría enviar. 
      // Aquí asumimos filtrado local para la búsqueda de texto como en LicenciasPage.
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

  // Lógica de filtrado local para la búsqueda de texto
  const aplicarFiltrosLocales = () => {
    let resultado = [...liquidaciones];

    if (filtroEmpleado) {
      const termino = filtroEmpleado.toLowerCase();
      resultado = resultado.filter((liq) => {
        const nombre = liq.empleado?.user?.nombre?.toLowerCase() || '';
        const apellido = liq.empleado?.user?.apellido?.toLowerCase() || '';
        const rut = liq.empleado?.user?.rut ? `${liq.empleado.user.rut}-${liq.empleado.user.rut_verificador}` : '';
        
        return nombre.includes(termino) || apellido.includes(termino) || rut.includes(termino);
      });
    }
    setFilteredLiquidaciones(resultado);
  };

  // --- MISMAS FUNCIONES DE NEGOCIO (Sin cambios) ---
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
      estado: 'procesada',
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
      alert('✅ Cálculo realizado.');
    } catch (error) {
      alert('Error al calcular liquidación: ' + error.message);
    } finally {
      setCalculando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!puedeEditar) return alert('No tiene permisos');
    if (!formData.empleado_id || !formData.periodo_desde || !formData.periodo_hasta || !formData.sueldo_base) {
      return alert('Complete todos los campos obligatorios');
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
      alert(error.message || 'Error al guardar liquidación');
    }
  };

  const handleDelete = async (id) => {
    if (!puedeEditar) return alert('No tiene permisos');
    const liquidacion = liquidaciones.find(l => l.id === id);
    if (!window.confirm('¿Está seguro de eliminar esta liquidación?')) return;
    
    try {
      await deleteLiquidacion(id);
      alert('✅ Liquidación eliminada exitosamente');
      cargarDatos();
    } catch (error) {
      alert(error.message || 'Error al eliminar liquidación');
    }
  };

  const handleMarcarComoPagada = async (liquidacion) => {
    if (!puedeEditar) return alert('No tiene permisos');
    if (!window.confirm('¿Marcar esta liquidación como PAGADA?')) return;

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
      alert(error.message || 'Error al cambiar estado');
    }
  };

  const handleDescargarPDF = async (id) => {
    try {
      await descargarLiquidacionPDF(id);
    } catch (error) {
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
      render: (item) => <span className="font-mono text-gray-600">{item.numero_comprobante || '-'}</span>
    },
    { 
      key: 'empleado', 
      label: 'Empleado',
      render: (item) => {
        if (item.empleado?.user) {
          return (
            <div>
              <div className="font-medium text-gray-900">{item.empleado.user.nombre} {item.empleado.user.apellido}</div>
              <div className="text-xs text-gray-500 font-mono">{item.empleado.numero_empleado || '-'}</div>
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
      render: (item) => <span className="font-medium text-gray-900">{formatCurrency(item.sueldo_liquido)}</span>
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
          return <span className="text-sm text-gray-600">{new Date(item.fecha_pago).toLocaleDateString('es-CL')}</span>;
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
          <MetricCard title="Total Liquidaciones" value={estadisticas.total_liquidaciones || 0} icon={FileText} color="blue" />
          <MetricCard title="Liquidaciones del Mes" value={estadisticas.liquidaciones_mes || 0} icon={Calendar} color="green" />
          <MetricCard title="Pagadas" value={estadisticas.liquidaciones_pagadas || 0} icon={CheckCircle} color="emerald" />
          <MetricCard title="Monto Pagado (Mes)" value={formatCurrency(estadisticas.monto_total_pagado_mes || 0)} icon={DollarSign} color="purple" />
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* 🟢 MODIFICADO: Input de búsqueda en lugar de Select para Empleado */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Buscar Empleado</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
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

      {/* Tabla con datos filtrados */}
      <Table
        columns={columns}
        data={filteredLiquidaciones}
        loading={loading}
        emptyMessage="No se encontraron liquidaciones con los filtros seleccionados"
      />

      {/* Dialog Formulario (Sin cambios visuales) */}
      {showDialog && (
        <FormDialog
          title={editingLiquidacion ? 'Editar Liquidación' : 'Nueva Liquidación'}
          isOpen={showDialog}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          size="large"
        >
          <div className="space-y-6">
            
            {/* Sección: Datos Básicos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Datos Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select de Empleado (EN MODAL SÍ SE MANTIENE EL SELECT PARA ELEGIR) */}
                <div className="space-y-1">
                  <Select
                    label="Empleado *"
                    value={formData.empleado_id}
                    onChange={(e) => handleEmpleadoChange(e.target.value)}
                    options={[
                      { id: '', label: 'Seleccione empleado' },
                      ...empleados.map(emp => ({
                        id: emp.id,
                        label: `${emp.user?.nombre} ${emp.user?.apellido} - ${emp.numero_empleado}`
                      }))
                    ]}
                    required
                    disabled={editingLiquidacion}
                  />
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
                    disabled={calculando || !formData.empleado_id || !formData.periodo_desde || !formData.periodo_hasta}
                    className="w-full flex items-center justify-center gap-2 border-dashed border-2"
                  >
                    <Calculator size={18} />
                    {calculando ? 'Calculando...' : 'Forzar Recálculo'}
                  </Button>
                </div>
              )}
            </div>

            {/* Sección: Haberes */}
            <div>
              <h3 className="text-lg font-semibold text-green-700 border-b border-green-200 pb-2 mb-4">Haberes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Sueldo Base (CLP) *"
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

            {/* Sección: Descuentos */}
            <div>
              <h3 className="text-lg font-semibold text-red-700 border-b border-red-200 pb-2 mb-4">Descuentos Legales</h3>
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
              <div className="mt-2 text-xs text-gray-500 italic">
                * Al seleccionar un empleado, los descuentos de AFP e Isapre/Fonasa se calculan automáticamente.
              </div>
            </div>

            {/* Resumen Líquido */}
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