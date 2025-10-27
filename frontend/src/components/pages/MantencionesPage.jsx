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

const SAMPLE_MAINTENANCE = [
  { id: 1, patenteBus: 'SASA01', tipoMantenimiento: 'Preventivo', descripcion: 'Cambio de aceite y filtros', fechaInicio: '2025-10-15', estado: 'En Proceso', costo: 150000 },
  { id: 2, patenteBus: 'SASA02', tipoMantenimiento: 'Correctivo', descripcion: 'Reparación de frenos', fechaInicio: '2025-10-10', estado: 'Completado', costo: 450000 },
  { id: 3, patenteBus: 'SASA03', tipoMantenimiento: 'Preventivo', descripcion: 'Revisión general', fechaInicio: '2025-10-18', estado: 'En Proceso', costo: 200000 },
  { id: 4, patenteBus: 'SASA04', tipoMantenimiento: 'Revisión', descripcion: 'Inspección técnica', fechaInicio: '2025-10-20', estado: 'Pendiente', costo: 100000 },
];

const TIPOS_MANTENIMIENTO = ['Preventivo', 'Correctivo', 'Revisión'];
const ESTADOS_MANTENIMIENTO = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'];

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState(SAMPLE_MAINTENANCE);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [formData, setFormData] = useState({
    patenteBus: '',
    tipoMantenimiento: 'Preventivo',
    descripcion: '',
    fechaInicio: '',
    estado: 'Pendiente',
    costo: '',
  });

  const handleOpenDialog = (maint = null) => {
    if (maint) {
      setEditingMaintenance(maint);
      setFormData(maint);
    } else {
      setEditingMaintenance(null);
      setFormData({
        patenteBus: '',
        tipoMantenimiento: 'Preventivo',
        descripcion: '',
        fechaInicio: '',
        estado: 'Pendiente',
        costo: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMaintenance(null);
  };

  const handleSave = () => {
    if (editingMaintenance) {
      setMaintenance(maintenance.map(m => m.id === editingMaintenance.id ? { ...m, ...formData } : m));
    } else {
      setMaintenance([...maintenance, { id: Math.max(...maintenance.map(m => m.id), 0) + 1, ...formData }]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    setMaintenance(maintenance.filter(m => m.id !== id));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'En Proceso':
        return '#fff3cd';
      case 'Completado':
        return '#d4edda';
      case 'Pendiente':
        return '#cfe2ff';
      default:
        return '#f8d7da';
    }
  };

  const getStatusTextColor = (status) => {
    switch(status) {
      case 'En Proceso':
        return '#856404';
      case 'Completado':
        return '#155724';
      case 'Pendiente':
        return '#004085';
      default:
        return '#721c24';
    }
  };

  return (
    <Box>
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
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Descripción</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha Inicio</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Costo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {maintenance.map((maint) => (
              <TableRow key={maint.id}>
                <TableCell sx={{ fontWeight: 'bold' }}>{maint.patenteBus}</TableCell>
                <TableCell>{maint.tipoMantenimiento}</TableCell>
                <TableCell>{maint.descripcion}</TableCell>
                <TableCell>{maint.fechaInicio}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 0.5,
                      borderRadius: '20px',
                      backgroundColor: getStatusColor(maint.estado),
                      color: getStatusTextColor(maint.estado),
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {maint.estado}
                  </Box>
                </TableCell>
                <TableCell align="right">{formatCurrency(maint.costo)}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(maint)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(maint.id)}
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
          {editingMaintenance ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Patente del Bus"
            value={formData.patenteBus}
            onChange={(e) => setFormData({ ...formData, patenteBus: e.target.value })}
            margin="normal"
            placeholder="SASA01"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Mantenimiento</InputLabel>
            <Select
              value={formData.tipoMantenimiento}
              onChange={(e) => setFormData({ ...formData, tipoMantenimiento: e.target.value })}
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
            value={formData.fechaInicio}
            onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
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
              {ESTADOS_MANTENIMIENTO.map((e) => (
                <MenuItem key={e} value={e}>{e}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Costo (CLP)"
            type="number"
            value={formData.costo}
            onChange={(e) => setFormData({ ...formData, costo: parseInt(e.target.value) })}
            margin="normal"
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