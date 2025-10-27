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

const SAMPLE_TRIPS = [
  { id: 1, fecha: '2025-10-25', bus: 'SASA01', conductor: 'Juan Pérez', ruta: 'RT001', horaInicio: '08:00', horaTermino: '09:30', estado: 'Completado', pasajeros: 42 },
  { id: 2, fecha: '2025-10-25', bus: 'SASA02', conductor: 'Carlos López', ruta: 'RT002', horaInicio: '10:00', horaTermino: '11:00', estado: 'En Curso', pasajeros: 45 },
  { id: 3, fecha: '2025-10-25', bus: 'SASA04', conductor: 'Roberto Silva', ruta: 'RT003', horaInicio: '06:00', horaTermino: '07:45', estado: 'Completado', pasajeros: 48 },
  { id: 4, fecha: '2025-10-26', bus: 'SASA01', conductor: 'Juan Pérez', ruta: 'RT001', horaInicio: '08:00', horaTermino: '09:30', estado: 'Programado', pasajeros: 0 },
];

const ESTADOS_VIAJE = ['Programado', 'En Curso', 'Completado', 'Cancelado'];

export default function TripsPage() {
  const [trips, setTrips] = useState(SAMPLE_TRIPS);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState({
    fecha: '',
    bus: '',
    conductor: '',
    ruta: '',
    horaInicio: '',
    horaTermino: '',
    estado: 'Programado',
    pasajeros: 0,
  });

  const handleOpenDialog = (trip = null) => {
    if (trip) {
      setEditingTrip(trip);
      setFormData(trip);
    } else {
      setEditingTrip(null);
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        bus: '',
        conductor: '',
        ruta: '',
        horaInicio: '',
        horaTermino: '',
        estado: 'Programado',
        pasajeros: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTrip(null);
  };

  const handleSave = () => {
    if (editingTrip) {
      setTrips(trips.map(t => t.id === editingTrip.id ? { ...t, ...formData } : t));
    } else {
      setTrips([...trips, { id: Math.max(...trips.map(t => t.id), 0) + 1, ...formData }]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    setTrips(trips.filter(t => t.id !== id));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'En Curso':
        return '#fff3cd';
      case 'Completado':
        return '#d4edda';
      case 'Programado':
        return '#cfe2ff';
      default:
        return '#f8d7da';
    }
  };

  const getStatusTextColor = (status) => {
    switch(status) {
      case 'En Curso':
        return '#856404';
      case 'Completado':
        return '#155724';
      case 'Programado':
        return '#004085';
      default:
        return '#721c24';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <h2>Gestión de Viajes</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Viaje
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Bus</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Conductor</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ruta</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Hora Inicio</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Hora Término</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pasajeros</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell>{trip.fecha}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{trip.bus}</TableCell>
                <TableCell>{trip.conductor}</TableCell>
                <TableCell>{trip.ruta}</TableCell>
                <TableCell>{trip.horaInicio}</TableCell>
                <TableCell>{trip.horaTermino}</TableCell>
                <TableCell>{trip.pasajeros}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 0.5,
                      borderRadius: '20px',
                      backgroundColor: getStatusColor(trip.estado),
                      color: getStatusTextColor(trip.estado),
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {trip.estado}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(trip)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(trip.id)}
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
          {editingTrip ? 'Editar Viaje' : 'Nuevo Viaje'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Fecha"
            type="date"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Bus (Patente)"
            value={formData.bus}
            onChange={(e) => setFormData({ ...formData, bus: e.target.value })}
            margin="normal"
            placeholder="SASA01"
          />
          <TextField
            fullWidth
            label="Conductor"
            value={formData.conductor}
            onChange={(e) => setFormData({ ...formData, conductor: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Ruta"
            value={formData.ruta}
            onChange={(e) => setFormData({ ...formData, ruta: e.target.value })}
            margin="normal"
            placeholder="RT001"
          />
          <TextField
            fullWidth
            label="Hora de Inicio"
            type="time"
            value={formData.horaInicio}
            onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Hora de Término"
            type="time"
            value={formData.horaTermino}
            onChange={(e) => setFormData({ ...formData, horaTermino: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Pasajeros"
            type="number"
            value={formData.pasajeros}
            onChange={(e) => setFormData({ ...formData, pasajeros: parseInt(e.target.value) })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Estado</InputLabel>
            <Select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              label="Estado"
            >
              {ESTADOS_VIAJE.map((e) => (
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