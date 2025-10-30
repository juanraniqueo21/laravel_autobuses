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
import { fetchViajes, fetchBuses, fetchConductores, fetchAsistentes, fetchRutas, createViaje, updateViaje, deleteViaje } from '../../services/api';

const ESTADOS_VIAJE = ['programado', 'en_curso', 'completado', 'cancelado'];

export default function ViajesPage() {
  const [viajes, setViajes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [asistentes, setAsistentes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingViaje, setEditingViaje] = useState(null);
  const [formData, setFormData] = useState({
    bus_id: '',
    conductor_id: '',
    asistente_id: '',
    ruta_id: '',
    fecha_hora_salida: '',
    fecha_hora_llegada: '',
    pasajeros_transportados: '',
    combustible_gastado: '',
    kilometraje_inicial: '',
    kilometraje_final: '',
    estado: 'programado',
    observaciones: '',
    incidentes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [viagesData, busesData, conductoresData, asistentesData, rutasData] = await Promise.all([
        fetchViajes(),
        fetchBuses(),
        fetchConductores(),
        fetchAsistentes(),
        fetchRutas(),
      ]);
      setViajes(viagesData);
      setBuses(busesData);
      setConductores(conductoresData);
      setAsistentes(asistentesData);
      setRutas(rutasData);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (viaje = null) => {
    if (viaje) {
      setEditingViaje(viaje);
      setFormData(viaje);
    } else {
      setEditingViaje(null);
      setFormData({
        bus_id: '',
        conductor_id: '',
        asistente_id: '',
        ruta_id: '',
        fecha_hora_salida: '',
        fecha_hora_llegada: '',
        pasajeros_transportados: '',
        combustible_gastado: '',
        kilometraje_inicial: '',
        kilometraje_final: '',
        estado: 'programado',
        observaciones: '',
        incidentes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingViaje(null);
  };

  const handleSave = async () => {
    try {
      if (editingViaje) {
        await updateViaje(editingViaje.id, formData);
      } else {
        await createViaje(formData);
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
        await deleteViaje(id);
        loadData();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const getPatente = (busId) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? bus.patente : 'N/A';
  };

  const getConductorNombre = (conducId) => {
    const cond = conductores.find(c => c.id === conducId);
    return cond && cond.empleado ? `${cond.empleado.user?.nombre || ''} ${cond.empleado.user?.apellido || ''}` : 'N/A';
  };

  const getRutaNombre = (rutaId) => {
    const ruta = rutas.find(r => r.id === rutaId);
    return ruta ? ruta.nombre_ruta : 'N/A';
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
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Salida</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Llegada</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pasajeros</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {viajes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">No hay viajes</TableCell>
              </TableRow>
            ) : (
              viajes.map((viaje) => (
                <TableRow key={viaje.id}>
                  <TableCell>{viaje.fecha_hora_salida?.split('T')[0]}</TableCell>
                  <TableCell>{getPatente(viaje.bus_id)}</TableCell>
                  <TableCell>{getConductorNombre(viaje.conductor_id)}</TableCell>
                  <TableCell>{getRutaNombre(viaje.ruta_id)}</TableCell>
                  <TableCell>{viaje.fecha_hora_salida?.split('T')[1]?.slice(0, 5)}</TableCell>
                  <TableCell>{viaje.fecha_hora_llegada?.split('T')[1]?.slice(0, 5) || 'N/A'}</TableCell>
                  <TableCell>{viaje.pasajeros_transportados || 0}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        backgroundColor: viaje.estado === 'completado' ? '#c8e6c9' : viaje.estado === 'en_curso' ? '#fff9c4' : '#e3f2fd',
                        color: viaje.estado === 'completado' ? '#2e7d32' : viaje.estado === 'en_curso' ? '#f57f17' : '#1565c0',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {viaje.estado}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(viaje)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(viaje.id)}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingViaje ? 'Editar Viaje' : 'Nuevo Viaje'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Bus</InputLabel>
            <Select
              value={formData.bus_id}
              onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
              label="Bus"
            >
              <MenuItem value="">Seleccionar bus</MenuItem>
              {buses.map((bus) => (
                <MenuItem key={bus.id} value={bus.id}>
                  {bus.patente} - {bus.marca} {bus.modelo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Conductor</InputLabel>
            <Select
              value={formData.conductor_id}
              onChange={(e) => setFormData({ ...formData, conductor_id: e.target.value })}
              label="Conductor"
            >
              <MenuItem value="">Seleccionar conductor</MenuItem>
              {conductores.map((cond) => (
                <MenuItem key={cond.id} value={cond.id}>
                  {cond.empleado?.user?.nombre} {cond.empleado?.user?.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Asistente (Opcional)</InputLabel>
            <Select
              value={formData.asistente_id}
              onChange={(e) => setFormData({ ...formData, asistente_id: e.target.value })}
              label="Asistente"
            >
              <MenuItem value="">Sin asistente</MenuItem>
              {asistentes.map((asist) => (
                <MenuItem key={asist.id} value={asist.id}>
                  {asist.empleado?.user?.nombre} {asist.empleado?.user?.apellido}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Ruta</InputLabel>
            <Select
              value={formData.ruta_id}
              onChange={(e) => setFormData({ ...formData, ruta_id: e.target.value })}
              label="Ruta"
            >
              <MenuItem value="">Seleccionar ruta</MenuItem>
              {rutas.map((ruta) => (
                <MenuItem key={ruta.id} value={ruta.id}>
                  {ruta.codigo_ruta} - {ruta.nombre_ruta}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Fecha y Hora de Salida"
            type="datetime-local"
            value={formData.fecha_hora_salida}
            onChange={(e) => setFormData({ ...formData, fecha_hora_salida: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Fecha y Hora de Llegada"
            type="datetime-local"
            value={formData.fecha_hora_llegada}
            onChange={(e) => setFormData({ ...formData, fecha_hora_llegada: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Pasajeros Transportados"
            type="number"
            value={formData.pasajeros_transportados}
            onChange={(e) => setFormData({ ...formData, pasajeros_transportados: parseInt(e.target.value) })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Combustible Gastado (L)"
            type="number"
            value={formData.combustible_gastado}
            onChange={(e) => setFormData({ ...formData, combustible_gastado: parseFloat(e.target.value) })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Kilometraje Inicial"
            type="number"
            value={formData.kilometraje_inicial}
            onChange={(e) => setFormData({ ...formData, kilometraje_inicial: parseInt(e.target.value) })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Kilometraje Final"
            type="number"
            value={formData.kilometraje_final}
            onChange={(e) => setFormData({ ...formData, kilometraje_final: parseInt(e.target.value) })}
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

          <TextField
            fullWidth
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            margin="normal"
            multiline
            rows={2}
          />

          <TextField
            fullWidth
            label="Incidentes"
            value={formData.incidentes}
            onChange={(e) => setFormData({ ...formData, incidentes: e.target.value })}
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