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

const SAMPLE_ROUTES = [
  { id: 1, codigoRuta: 'RT001', nombreRuta: 'Centro - Periferia Norte', puntoSalida: 'Terminal Centro', puntoDestino: 'Sector Norte', distanciaKm: 25.5, tiempoEstimado: 45, estado: 'Activa' },
  { id: 2, codigoRuta: 'RT002', nombreRuta: 'Centro - Periferia Sur', puntoSalida: 'Terminal Centro', puntoDestino: 'Sector Sur', distanciaKm: 30.2, tiempoEstimado: 50, estado: 'Activa' },
  { id: 3, codigoRuta: 'RT003', nombreRuta: 'Norte - Sur', puntoSalida: 'Sector Norte', puntoDestino: 'Sector Sur', distanciaKm: 45.8, tiempoEstimado: 75, estado: 'Activa' },
  { id: 4, codigoRuta: 'RT004', nombreRuta: 'Centro - Aeropuerto', puntoSalida: 'Terminal Centro', puntoDestino: 'Aeropuerto', distanciaKm: 18.3, tiempoEstimado: 30, estado: 'En Revisión' },
];

const ESTADOS_RUTA = ['Activa', 'Inactiva', 'En Revisión'];

export default function RoutesPage() {
  const [routes, setRoutes] = useState(SAMPLE_ROUTES);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({
    codigoRuta: '',
    nombreRuta: '',
    puntoSalida: '',
    puntoDestino: '',
    distanciaKm: '',
    tiempoEstimado: '',
    estado: 'Activa',
  });

  const handleOpenDialog = (route = null) => {
    if (route) {
      setEditingRoute(route);
      setFormData(route);
    } else {
      setEditingRoute(null);
      setFormData({
        codigoRuta: '',
        nombreRuta: '',
        puntoSalida: '',
        puntoDestino: '',
        distanciaKm: '',
        tiempoEstimado: '',
        estado: 'Activa',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRoute(null);
  };

  const handleSave = () => {
    if (editingRoute) {
      setRoutes(routes.map(r => r.id === editingRoute.id ? { ...r, ...formData } : r));
    } else {
      setRoutes([...routes, { id: Math.max(...routes.map(r => r.id), 0) + 1, ...formData }]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    setRoutes(routes.filter(r => r.id !== id));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <h2>Gestión de Rutas</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Ruta
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre Ruta</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Salida</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Destino</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Distancia (km)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tiempo Est.</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.id}>
                <TableCell sx={{ fontWeight: 'bold' }}>{route.codigoRuta}</TableCell>
                <TableCell>{route.nombreRuta}</TableCell>
                <TableCell>{route.puntoSalida}</TableCell>
                <TableCell>{route.puntoDestino}</TableCell>
                <TableCell>{route.distanciaKm}</TableCell>
                <TableCell>{route.tiempoEstimado} min</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 0.5,
                      borderRadius: '20px',
                      backgroundColor: route.estado === 'Activa' ? '#c8e6c9' : '#fff9c4',
                      color: route.estado === 'Activa' ? '#2e7d32' : '#f57f17',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {route.estado}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(route)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(route.id)}
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
          {editingRoute ? 'Editar Ruta' : 'Nueva Ruta'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Código de Ruta"
            value={formData.codigoRuta}
            onChange={(e) => setFormData({ ...formData, codigoRuta: e.target.value })}
            margin="normal"
            placeholder="RT001"
          />
          <TextField
            fullWidth
            label="Nombre de Ruta"
            value={formData.nombreRuta}
            onChange={(e) => setFormData({ ...formData, nombreRuta: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Punto de Salida"
            value={formData.puntoSalida}
            onChange={(e) => setFormData({ ...formData, puntoSalida: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Punto de Destino"
            value={formData.puntoDestino}
            onChange={(e) => setFormData({ ...formData, puntoDestino: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Distancia (km)"
            type="number"
            value={formData.distanciaKm}
            onChange={(e) => setFormData({ ...formData, distanciaKm: parseFloat(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Tiempo Estimado (minutos)"
            type="number"
            value={formData.tiempoEstimado}
            onChange={(e) => setFormData({ ...formData, tiempoEstimado: parseInt(e.target.value) })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Estado</InputLabel>
            <Select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              label="Estado"
            >
              {ESTADOS_RUTA.map((e) => (
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