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
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { fetchConductores, createConductor, updateConductor, deleteConductor } from '../../services/api';

const CLASES_LICENCIA = ['A', 'B', 'C', 'D', 'E'];
const ESTADOS = ['activo', 'baja_medica', 'suspendido', 'inactivo'];

export default function ConductorsPage() {
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConductor, setEditingConductor] = useState(null);
  const [formData, setFormData] = useState({
    empleado_id: '',
    numero_licencia: '',
    clase_licencia: 'E',
    fecha_vencimiento_licencia: '',
    puntos_licencia: 0,
    estado: 'activo',
  });

  useEffect(() => {
    loadConductores();
  }, []);

  const loadConductores = async () => {
    try {
      setLoading(true);
      const data = await fetchConductores();
      setConductores(data);
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
        fecha_vencimiento_licencia: '',
        puntos_licencia: 0,
        estado: 'activo',
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
        <h2>Gestión de Conductores</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Conductor
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Empleado ID</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Número Licencia</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Clase</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vencimiento</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Puntos</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conductores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No hay conductores</TableCell>
              </TableRow>
            ) : (
              conductores.map((conductor) => (
                <TableRow key={conductor.id}>
                  <TableCell>{conductor.empleado_id}</TableCell>
                  <TableCell>{conductor.numero_licencia}</TableCell>
                  <TableCell>{conductor.clase_licencia}</TableCell>
                  <TableCell>
                    <Box sx={{ color: isLicenseExpiring(conductor.fecha_vencimiento_licencia) ? 'orange' : 'inherit' }}>
                      {conductor.fecha_vencimiento_licencia}
                      {isLicenseExpiring(conductor.fecha_vencimiento_licencia) && ' ⚠️'}
                    </Box>
                  </TableCell>
                  <TableCell>{conductor.puntos_licencia}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        backgroundColor: conductor.estado === 'activo' ? '#c8e6c9' : '#ffccbc',
                        color: conductor.estado === 'activo' ? '#2e7d32' : '#d84315',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {conductor.estado}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(conductor)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(conductor.id)}
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
          {editingConductor ? 'Editar Conductor' : 'Nuevo Conductor'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Empleado ID"
            type="number"
            value={formData.empleado_id}
            onChange={(e) => setFormData({ ...formData, empleado_id: parseInt(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Número de Licencia"
            value={formData.numero_licencia}
            onChange={(e) => setFormData({ ...formData, numero_licencia: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Clase de Licencia</InputLabel>
            <Select
              value={formData.clase_licencia}
              onChange={(e) => setFormData({ ...formData, clase_licencia: e.target.value })}
              label="Clase de Licencia"
            >
              {CLASES_LICENCIA.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Fecha de Vencimiento"
            type="date"
            value={formData.fecha_vencimiento_licencia}
            onChange={(e) => setFormData({ ...formData, fecha_vencimiento_licencia: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Puntos de Licencia"
            type="number"
            value={formData.puntos_licencia}
            onChange={(e) => setFormData({ ...formData, puntos_licencia: parseInt(e.target.value) })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Estado</InputLabel>
            <Select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              label="Estado"
            >
              {ESTADOS.map((e) => (
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