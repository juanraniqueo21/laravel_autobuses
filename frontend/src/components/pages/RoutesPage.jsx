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
import { fetchRutas, createRuta, updateRuta, deleteRuta } from '../../services/api';

const ESTADOS_RUTA = ['activa', 'inactiva', 'en_revision'];

export default function RutasPage() {
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRuta, setEditingRuta] = useState(null);
  const [formData, setFormData] = useState({
    nombre_ruta: '',
    codigo_ruta: '',
    punto_salida: '',
    punto_destino: '',
    distancia_km: '',
    tiempo_estimado_minutos: '',
    descripcion: '',
    tarifa: '',
    estado: 'activa',
  });

  useEffect(() => {
    loadRutas();
  }, []);

  const loadRutas = async () => {
    try {
      setLoading(true);
      const data = await fetchRutas();
      setRutas(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar rutas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (ruta = null) => {
    if (ruta) {
      setEditingRuta(ruta);
      setFormData(ruta);
    } else {
      setEditingRuta(null);
      setFormData({
        nombre_ruta: '',
        codigo_ruta: '',
        punto_salida: '',
        punto_destino: '',
        distancia_km: '',
        tiempo_estimado_minutos: '',
        descripcion: '',
        tarifa: '',
        estado: 'activa',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRuta(null);
  };

  const handleSave = async () => {
    try {
      if (editingRuta) {
        await updateRuta(editingRuta.id, formData);
      } else {
        await createRuta(formData);
      }
      loadRutas();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await deleteRuta(id);
        loadRutas();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
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
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Salida</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Destino</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Km</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tiempo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tarifa</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rutas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">No hay rutas</TableCell>
              </TableRow>
            ) : (
              rutas.map((ruta) => (
                <TableRow key={ruta.id}>
                  <TableCell>{ruta.codigo_ruta}</TableCell>
                  <TableCell>{ruta.nombre_ruta}</TableCell>
                  <TableCell>{ruta.punto_salida}</TableCell>
                  <TableCell>{ruta.punto_destino}</TableCell>
                  <TableCell>{ruta.distancia_km}</TableCell>
                  <TableCell>{ruta.tiempo_estimado_minutos} min</TableCell>
                  <TableCell>${ruta.tarifa}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        backgroundColor: ruta.estado === 'activa' ? '#c8e6c9' : '#ffccbc',
                        color: ruta.estado === 'activa' ? '#2e7d32' : '#d84315',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {ruta.estado}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(ruta)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(ruta.id)}
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
          {editingRuta ? 'Editar Ruta' : 'Nueva Ruta'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Código de Ruta"
            value={formData.codigo_ruta}
            onChange={(e) => setFormData({ ...formData, codigo_ruta: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Nombre de Ruta"
            value={formData.nombre_ruta}
            onChange={(e) => setFormData({ ...formData, nombre_ruta: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Punto de Salida"
            value={formData.punto_salida}
            onChange={(e) => setFormData({ ...formData, punto_salida: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Punto de Destino"
            value={formData.punto_destino}
            onChange={(e) => setFormData({ ...formData, punto_destino: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Distancia (km)"
            type="number"
            value={formData.distancia_km}
            onChange={(e) => setFormData({ ...formData, distancia_km: parseFloat(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Tiempo Estimado (minutos)"
            type="number"
            value={formData.tiempo_estimado_minutos}
            onChange={(e) => setFormData({ ...formData, tiempo_estimado_minutos: parseInt(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Tarifa (CLP)"
            type="number"
            value={formData.tarifa}
            onChange={(e) => setFormData({ ...formData, tarifa: parseInt(e.target.value) })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Descripción"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            margin="normal"
            multiline
            rows={2}
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