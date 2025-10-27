import React, { useState } from 'react';
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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

const SAMPLE_CONDUCTORS = [
  { id: 1, nombre: 'Juan Pérez', numeroLicencia: 'LIC001', claseLicencia: 'E', vencimientoLicencia: '2025-06-15', puntosLicencia: 10, estado: 'Activo' },
  { id: 2, nombre: 'Carlos López', numeroLicencia: 'LIC002', claseLicencia: 'E', vencimientoLicencia: '2025-09-20', puntosLicencia: 5, estado: 'Activo' },
  { id: 3, nombre: 'Roberto Silva', numeroLicencia: 'LIC003', claseLicencia: 'D', vencimientoLicencia: '2025-03-10', puntosLicencia: 0, estado: 'Suspendido' },
];

const CLASES_LICENCIA = ['A', 'B', 'C', 'D', 'E'];
const ESTADOS = ['Activo', 'Baja Médica', 'Suspendido', 'Inactivo'];

export default function ConductorsPage() {
  const [conductors, setConductors] = useState(SAMPLE_CONDUCTORS);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConductor, setEditingConductor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    numeroLicencia: '',
    claseLicencia: 'E',
    vencimientoLicencia: '',
    puntosLicencia: 0,
    estado: 'Activo',
  });

  const handleOpenDialog = (conductor = null) => {
    if (conductor) {
      setEditingConductor(conductor);
      setFormData(conductor);
    } else {
      setEditingConductor(null);
      setFormData({
        nombre: '',
        numeroLicencia: '',
        claseLicencia: 'E',
        vencimientoLicencia: '',
        puntosLicencia: 0,
        estado: 'Activo',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingConductor(null);
  };

  const handleSave = () => {
    if (editingConductor) {
      setConductors(conductors.map(c => c.id === editingConductor.id ? { ...c, ...formData } : c));
    } else {
      setConductors([...conductors, { id: Math.max(...conductors.map(c => c.id), 0) + 1, ...formData }]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    setConductors(conductors.filter(c => c.id !== id));
  };

  const isLicenseExpiring = (date) => {
    const today = new Date();
    const expiryDate = new Date(date);
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft < 60 && daysLeft > 0;
  };

  return (
    <Box>
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
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Número Licencia</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Clase</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vencimiento</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Puntos</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conductors.map((conductor) => (
              <TableRow key={conductor.id}>
                <TableCell>{conductor.nombre}</TableCell>
                <TableCell>{conductor.numeroLicencia}</TableCell>
                <TableCell>{conductor.claseLicencia}</TableCell>
                <TableCell>
                  <Box sx={{ color: isLicenseExpiring(conductor.vencimientoLicencia) ? 'orange' : 'inherit' }}>
                    {conductor.vencimientoLicencia}
                    {isLicenseExpiring(conductor.vencimientoLicencia) && ' ⚠️'}
                  </Box>
                </TableCell>
                <TableCell>{conductor.puntosLicencia}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 0.5,
                      borderRadius: '20px',
                      backgroundColor: conductor.estado === 'Activo' ? '#c8e6c9' : '#ffccbc',
                      color: conductor.estado === 'Activo' ? '#2e7d32' : '#d84315',
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingConductor ? 'Editar Conductor' : 'Nuevo Conductor'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nombre Completo"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Número de Licencia"
            value={formData.numeroLicencia}
            onChange={(e) => setFormData({ ...formData, numeroLicencia: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Clase de Licencia</InputLabel>
            <Select
              value={formData.claseLicencia}
              onChange={(e) => setFormData({ ...formData, claseLicencia: e.target.value })}
              label="Clase de Licencia"
            >
              {CLASES_LICENCIA.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Vencimiento de Licencia"
            type="date"
            value={formData.vencimientoLicencia}
            onChange={(e) => setFormData({ ...formData, vencimientoLicencia: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Puntos de Licencia"
            type="number"
            value={formData.puntosLicencia}
            onChange={(e) => setFormData({ ...formData, puntosLicencia: parseInt(e.target.value) })}
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