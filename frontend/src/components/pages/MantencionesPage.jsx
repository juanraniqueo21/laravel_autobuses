import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Box,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { 
  fetchBuses, 
  fetchEmpleados, 
  fetchMantenimientos,
  createMantenimiento, 
  updateMantenimiento, 
  deleteMantenimiento 
} from '../../services/api';

const TIPOS_MANTENIMIENTO = ['preventivo', 'correctivo', 'revision'];
const ESTADOS_MANTENIMIENTO = ['en_proceso', 'completado', 'cancelado'];

export default function MantencionesPage() {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [buses, setBuses] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMantenimiento, setEditingMantenimiento] = useState(null);
  const [formData, setFormData] = useState({
    bus_id: '',
    mecanico_id: '',
    tipo_mantenimiento: 'preventivo',
    descripcion: '',
    fecha_inicio: '',
    fecha_termino: '',
    costo_total: '',
    estado: 'en_proceso',
    repuestos_utilizados: '',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [busesData, empleadosData, mantenimientosData] = await Promise.all([
        fetchBuses(),
        fetchEmpleados(),
        fetchMantenimientos(),
      ]);
      
      setBuses(busesData);
      // Filtrar solo mecánicos
      const mechanics = empleadosData.filter(emp => emp.mecanico);
      setMecanicos(mechanics);
      setMantenimientos(mantenimientosData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mantenimiento = null) => {
    if (mantenimiento) {
      setEditingMantenimiento(mantenimiento);
      setFormData(mantenimiento);
    } else {
      setEditingMantenimiento(null);
      setFormData({
        bus_id: '',
        mecanico_id: '',
        tipo_mantenimiento: 'preventivo',
        descripcion: '',
        fecha_inicio: '',
        fecha_termino: '',
        costo_total: '',
        estado: 'en_proceso',
        repuestos_utilizados: '',
        observaciones: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMantenimiento(null);
  };

  const handleSave = async () => {
    try {
      if (editingMantenimiento) {
        await updateMantenimiento(editingMantenimiento.id, formData);
      } else {
        await createMantenimiento(formData);
      }
      loadData();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await deleteMantenimiento(id);
        loadData();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const getPatente = (busId) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? bus.patente : 'N/A';
  };

  const getMecanicoNombre = (mecanicoId) => {
    const mecanico = mecanicos.find(m => m.mecanico && m.mecanico.id === mecanicoId);
    return mecanico ? `${mecanico.user?.nombre || ''} ${mecanico.user?.apellido || ''}` : 'N/A';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value || 0);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'en_proceso':
        return '#fff3cd';
      case 'completado':
        return '#d4edda';
      case 'cancelado':
        return '#f8d7da';
      default:
        return '#cfe2ff';
    }
  };

  const getStatusTextColor = (status) => {
    switch(status) {
      case 'en_proceso':
        return '#856404';
      case 'completado':
        return '#155724';
      case 'cancelado':
        return '#721c24';
      default:
        return '#004085';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <h2>Gestión de Mantenimiento</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Mantenimiento
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Patente Bus</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Mecánico</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Descripción</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha Inicio</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Costo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mantenimientos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No hay mantenimientos</TableCell>
              </TableRow>
            ) : (
              mantenimientos.map((mant) => (
                <TableRow key={mant.id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{getPatente(mant.bus_id)}</TableCell>
                  <TableCell>{getMecanicoNombre(mant.mecanico_id)}</TableCell>
                  <TableCell>{mant.tipo_mantenimiento}</TableCell>
                  <TableCell>{mant.descripcion}</TableCell>
                  <TableCell>{mant.fecha_inicio}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        backgroundColor: getStatusColor(mant.estado),
                        color: getStatusTextColor(mant.estado),
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {mant.estado}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(mant.costo_total)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(mant)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(mant.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMantenimiento ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Bus</InputLabel>
            <Select
              value={formData.bus_id}
              onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
              label="Bus"
            >
              <MenuItem value="">Seleccionar bus</MenuItem>
              {buses.map((bus) => (
                <MenuItem key={bus.id} value={bus.id}>
                  {bus.patente} - {bus.marca} {bus.modelo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Mecánico</InputLabel>
            <Select
              value={formData.mecanico_id}
              onChange={(e) => setFormData({ ...formData, mecanico_id: e.target.value })}
              label="Mecánico"
            >
              <MenuItem value="">Seleccionar mecánico</MenuItem>
              {mecanicos.map((mec) => (
                <MenuItem key={mec.id} value={mec.mecanico.id}>
                  {mec.user?.nombre} {mec.user?.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Mantenimiento</InputLabel>
            <Select
              value={formData.tipo_mantenimiento}
              onChange={(e) => setFormData({ ...formData, tipo_mantenimiento: e.target.value })}
              label="Tipo de Mantenimiento"
            >
              {TIPOS_MANTENIMIENTO.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />

          <TextField
            fullWidth
            label="Fecha de Inicio"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Fecha de Término"
            type="date"
            value={formData.fecha_termino}
            onChange={(e) => setFormData({ ...formData, fecha_termino: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Costo Total (CLP)"
            type="number"
            value={formData.costo_total}
            onChange={(e) => setFormData({ ...formData, costo_total: parseInt(e.target.value) })}
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Estado</InputLabel>
            <Select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              label="Estado"
            >
              {ESTADOS_MANTENIMIENTO.map((e) => (
                <MenuItem key={e} value={e}>{e}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Repuestos Utilizados"
            value={formData.repuestos_utilizados}
            onChange={(e) => setFormData({ ...formData, repuestos_utilizados: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            placeholder="Ej: Aceite 5W30, Filtro aire, etc."
          />

          <TextField
            fullWidth
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}