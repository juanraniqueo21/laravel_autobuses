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
import { fetchAsistentes, fetchEmpleados, createAsistente, updateAsistente, deleteAsistente } from '../../services/api';

const ESTADOS_ASISTENTE = ['activo', 'inactivo', 'suspendido'];

export default function AsistentesPage() {
  const [asistentes, setAsistentes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAsistente, setEditingAsistente] = useState(null);
  const [formData, setFormData] = useState({
    empleado_id: '',
    fecha_inicio: '',
    fecha_termino: '',
    estado: 'activo',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [asistentesData, empleadosData] = await Promise.all([
        fetchAsistentes(),
        fetchEmpleados(),
      ]);
      setAsistentes(asistentesData);
      setEmpleados(empleadosData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (asistente = null) => {
    if (asistente) {
      setEditingAsistente(asistente);
      setFormData(asistente);
    } else {
      setEditingAsistente(null);
      setFormData({
        empleado_id: '',
        fecha_inicio: '',
        estado: 'activo',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAsistente(null);
  };

  const handleSave = async () => {
    try {
      if (editingAsistente) {
        await updateAsistente(editingAsistente.id, formData);
      } else {
        await createAsistente(formData);
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
        await deleteAsistente(id);
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
        <h2>Gestión de Asistentes</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Asistente
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha Inicio</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {asistentes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No hay asistentes</TableCell>
              </TableRow>
            ) : (
              asistentes.map((asistente) => (
                <TableRow key={asistente.id}>
                  <TableCell>{getEmpleadoNombre(asistente.empleado_id)}</TableCell>
                  <TableCell>{asistente.fecha_inicio}</TableCell>
                  <TableCell>{asistente.fecha_termino || 'N/A'}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        backgroundColor: asistente.estado === 'activo' ? '#c8e6c9' : '#ffccbc',
                        color: asistente.estado === 'activo' ? '#2e7d32' : '#d84315',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {asistente.estado}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(asistente)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(asistente.id)}
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
          {editingAsistente ? 'Editar Asistente' : 'Nuevo Asistente'}
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
              {empleados.filter(emp => emp.user?.rol_id === 5).map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.user?.nombre} {emp.user?.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Fecha de Inicio"
            type="date"
            value={formData.fecha_inicio}
            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
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
              {ESTADOS_ASISTENTE.map((e) => (
                <MenuItem key={e} value={e}>{e}</MenuItem>
              ))}
            </Select>
          </FormControl>
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