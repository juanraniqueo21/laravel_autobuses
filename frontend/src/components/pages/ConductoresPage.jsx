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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { fetchConductores, fetchEmpleados, createConductor, updateConductor, deleteConductor } from '../../services/api';
const CLASES_LICENCIA = ['A', 'B', 'C', 'D', 'E'];
const ESTADOS = ['activo', 'baja_medica', 'suspendido', 'inactivo'];
const ESTADOS_LICENCIA = ['vigente', 'vencida', 'suspendida'];

export default function ConductorsPage() {
  const [conductores, setConductores] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConductor, setEditingConductor] = useState(null);
  const [formData, setFormData] = useState({
    empleado_id: '',
    numero_licencia: '',
    clase_licencia: 'E',
    fecha_vencimiento_licencia: '',
    fecha_primera_licencia: '',
    puntos_licencia: 0,
    estado: 'activo',
    anios_experiencia: 0,
    estado_licencia: 'vigente',
    apto_conducir: true,
    certificado_rcp: false,
    certificado_defensa: false,
  });

  useEffect(() => {
    loadConductores();
  }, []);

  const loadConductores = async () => {
    try {
      setLoading(true);
      const [conductoresData, empleadosData] = await Promise.all([
        fetchConductores(),
        fetchEmpleados(),
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
      setFormData(conductor);
    } else {
      setEditingConductor(null);
      setFormData({
        empleado_id: '',
        numero_licencia: '',
        clase_licencia: 'E',
        fecha_primera_licencia: '',
        fecha_vencimiento_licencia: '',
        puntos_licencia: 0,
        estado: 'activo',
        anios_experiencia: 0,
        estado_licencia: 'vigente',
        apto_conducir: true,
        certificado_rcp: false,
        certificado_defensa: false,
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
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Emisión</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vencimiento</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Años Exp.</TableCell>
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
                  <TableCell>{conductor.fecha_primera_licencia}</TableCell>
                  <TableCell>
                    <Box sx={{ color: isLicenseExpiring(conductor.fecha_vencimiento_licencia) ? 'orange' : 'inherit' }}>
                      {conductor.fecha_vencimiento_licencia}
                      {isLicenseExpiring(conductor.fecha_vencimiento_licencia) && ' ⚠️'}
                    </Box>
                  </TableCell>
                  <TableCell>{conductor.anios_experiencia}</TableCell>
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
          <FormControl fullWidth margin="normal">
            <InputLabel>Empleado</InputLabel>
            <Select
              value={formData.empleado_id}
              onChange={(e) => setFormData({ ...formData, empleado_id: e.target.value })}
              label="Empleado"
            >
              <MenuItem value="">Seleccionar empleado</MenuItem>
              {empleados.filter(emp => emp.user?.rol_id === 3).map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.user?.nombre} {emp.user?.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Número de Licencia"
            value={formData.numero_licencia}
            onChange={(e) => setFormData({ ...formData, numero_licencia: e.target.value })}
            margin="normal"
            required
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
            label="Fecha de Emisión"
            type="date"
            value={formData.fecha_primera_licencia}
            onChange={(e) => setFormData({ ...formData, fecha_primera_licencia: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Fecha de Vencimiento"
            type="date"
            value={formData.fecha_vencimiento_licencia}
            onChange={(e) => setFormData({ ...formData, fecha_vencimiento_licencia: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Años de Experiencia"
            type="number"
            value={formData.anios_experiencia}
            onChange={(e) => setFormData({ ...formData, anios_experiencia: parseInt(e.target.value) })}
            margin="normal"
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
            <InputLabel>Estado de Licencia</InputLabel>
            <Select
              value={formData.estado_licencia}
              onChange={(e) => setFormData({ ...formData, estado_licencia: e.target.value })}
              label="Estado de Licencia"
            >
              {ESTADOS_LICENCIA.map((e) => (
                <MenuItem key={e} value={e}>{e}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.apto_conducir}
                onChange={(e) => setFormData({ ...formData, apto_conducir: e.target.checked })}
              />
            }
            label="Apto para Conducir"
            sx={{ mt: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.certificado_rcp}
                onChange={(e) => setFormData({ ...formData, certificado_rcp: e.target.checked })}
              />
            }
            label="Certificado RCP"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.certificado_defensa}
                onChange={(e) => setFormData({ ...formData, certificado_defensa: e.target.checked })}
              />
            }
            label="Certificado Defensa"
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