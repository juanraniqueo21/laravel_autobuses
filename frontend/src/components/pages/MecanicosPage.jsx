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
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { fetchMecanicos, fetchEmpleados, createMecanico, updateMecanico, deleteMecanico } from '../../services/api';

const ESTADOS_MECANICO = ['activo', 'inactivo', 'suspendido'];
const ESPECIALIDADES = ['Motor', 'Hidráulica', 'Electricidad', 'Frenos', 'Suspensión', 'Transmisión', 'General'];

export default function MecanicosPage() {
  const [mecanicos, setMecanicos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMecanico, setEditingMecanico] = useState(null);
  const [formData, setFormData] = useState({
    empleado_id: '',
    numero_certificacion: '',
    especialidad: '',
    fecha_certificacion: '',
    estado: 'activo',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mecanicosData, empleadosData] = await Promise.all([
        fetchMecanicos(),
        fetchEmpleados(),
      ]);
      setMecanicos(mecanicosData);
      setEmpleados(empleadosData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mecanico = null) => {
    if (mecanico) {
      setEditingMecanico(mecanico);
      setFormData(mecanico);
    } else {
      setEditingMecanico(null);
      setFormData({
        empleado_id: '',
        numero_certificacion: '',
        especialidad: '',
        fecha_certificacion: '',
        estado: 'activo',
        observaciones: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMecanico(null);
  };

  const handleSave = async () => {
    try {
      if (editingMecanico) {
        await updateMecanico(editingMecanico.id, formData);
      } else {
        await createMecanico(formData);
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
        await deleteMecanico(id);
        loadData();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const getEmpleadoNombre = (empleadoId) => {
    const emp = empleados.find(e => e.id === empleadoId);
    return emp ? `${emp.user?.nombre || ''} ${emp.user?.apellido || ''}` : 'N/A';
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
        <h2>Gestión de Mecánicos</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Mecánico
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Especialidad</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Certificación</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha Certificación</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mecanicos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay mecánicos</TableCell>
              </TableRow>
            ) : (
              mecanicos.map((mecanico) => (
                <TableRow key={mecanico.id}>
                  <TableCell>{getEmpleadoNombre(mecanico.empleado_id)}</TableCell>
                  <TableCell>{mecanico.especialidad}</TableCell>
                  <TableCell>{mecanico.numero_certificacion}</TableCell>
                  <TableCell>{mecanico.fecha_certificacion}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        backgroundColor: mecanico.estado === 'activo' ? '#c8e6c9' : '#ffccbc',
                        color: mecanico.estado === 'activo' ? '#2e7d32' : '#d84315',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {mecanico.estado}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(mecanico)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(mecanico.id)}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMecanico ? 'Editar Mecánico' : 'Nuevo Mecánico'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Empleado</InputLabel>
            <Select
              value={formData.empleado_id}
              onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
              label="Empleado"
            >
              <MenuItem value="">Seleccionar empleado</MenuItem>
              {empleados.filter(emp => emp.user?.rol_id === 4).map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.user?.nombre} {emp.user?.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Especialidad</InputLabel>
            <Select
              value={formData.especialidad}
              onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
              label="Especialidad"
            >
              <MenuItem value="">Seleccionar especialidad</MenuItem>
              {ESPECIALIDADES.map((esp) => (
                <MenuItem key={esp} value={esp}>{esp}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Número de Certificación"
            value={formData.numero_certificacion}
            onChange={(e) => setFormData({ ...formData, numero_certificacion: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Fecha de Certificación"
            type="date"
            value={formData.fecha_certificacion}
            onChange={(e) => setFormData({ ...formData, fecha_certificacion: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Estado</InputLabel>
            <Select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              label="Estado"
            >
              {ESTADOS_MECANICO.map((e) => (
                <MenuItem key={e} value={e}>{e}</MenuItem>
              ))}
            </Select>
          </FormControl>

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