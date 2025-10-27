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

const SAMPLE_BUSES = [
  { id: 1, patente: 'SASA01', marca: 'Volvo', modelo: 'B450R', año: 2022, capacidad: 45, estado: 'Operativo', proximaRevision: '2025-11-15' },
  { id: 2, patente: 'SASA02', marca: 'Mercedes', modelo: 'OH1628L', año: 2021, capacidad: 48, estado: 'Operativo', proximaRevision: '2025-10-30' },
  { id: 3, patente: 'SASA03', marca: 'Volvo', modelo: 'B430R', año: 2020, capacidad: 45, estado: 'Mantenimiento', proximaRevision: '2025-12-01' },
  { id: 4, patente: 'SASA04', marca: 'Scania', modelo: 'K400', año: 2019, capacidad: 50, estado: 'Operativo', proximaRevision: '2025-11-25' },
];

const ESTADOS_BUS = ['Operativo', 'Mantenimiento', 'Desmantelado'];

export default function BusesPage() {
  const [buses, setBuses] = useState(SAMPLE_BUSES);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [formData, setFormData] = useState({
    patente: '',
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    capacidad: 45,
    estado: 'Operativo',
    proximaRevision: '',
  });

  const handleOpenDialog = (bus = null) => {
    if (bus) {
      setEditingBus(bus);
      setFormData(bus);
    } else {
      setEditingBus(null);
      setFormData({
        patente: '',
        marca: '',
        modelo: '',
        año: new Date().getFullYear(),
        capacidad: 45,
        estado: 'Operativo',
        proximaRevision: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBus(null);
  };

  const handleSave = () => {
    if (editingBus) {
      setBuses(buses.map(b => b.id === editingBus.id ? { ...b, ...formData } : b));
    } else {
      setBuses([...buses, { id: Math.max(...buses.map(b => b.id), 0) + 1, ...formData }]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    setBuses(buses.filter(b => b.id !== id));
  };

  const isRevisionExpiring = (date) => {
    const today = new Date();
    const revisionDate = new Date(date);
    const daysLeft = Math.ceil((revisionDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft < 30 && daysLeft > 0;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <h2>Gestión de Buses</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Bus
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Patente</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Marca</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Modelo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Año</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Capacidad</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Próx. Revisión</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {buses.map((bus) => (
              <TableRow key={bus.id}>
                <TableCell sx={{ fontWeight: 'bold' }}>{bus.patente}</TableCell>
                <TableCell>{bus.marca}</TableCell>
                <TableCell>{bus.modelo}</TableCell>
                <TableCell>{bus.año}</TableCell>
                <TableCell>{bus.capacidad} pasajeros</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 0.5,
                      borderRadius: '20px',
                      backgroundColor: bus.estado === 'Operativo' ? '#c8e6c9' : '#ffccbc',
                      color: bus.estado === 'Operativo' ? '#2e7d32' : '#d84315',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {bus.estado}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ color: isRevisionExpiring(bus.proximaRevision) ? 'orange' : 'inherit' }}>
                    {bus.proximaRevision}
                    {isRevisionExpiring(bus.proximaRevision) && ' ⚠️'}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(bus)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(bus.id)}
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
          {editingBus ? 'Editar Bus' : 'Nuevo Bus'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Patente (SASA##)"
            value={formData.patente}
            onChange={(e) => setFormData({ ...formData, patente: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Marca"
            value={formData.marca}
            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Modelo"
            value={formData.modelo}
            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Año"
            type="number"
            value={formData.año}
            onChange={(e) => setFormData({ ...formData, año: parseInt(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Capacidad (pasajeros)"
            type="number"
            value={formData.capacidad}
            onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Estado</InputLabel>
            <Select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              label="Estado"
            >
              {ESTADOS_BUS.map((e) => (
                <MenuItem key={e} value={e}>{e}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Próxima Revisión Técnica"
            type="date"
            value={formData.proximaRevision}
            onChange={(e) => setFormData({ ...formData, proximaRevision: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
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