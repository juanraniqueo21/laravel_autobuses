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
  Grid,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { fetchBuses, createBus, updateBus, deleteBus } from '../../services/api';

const ESTADOS_BUS = ['operativo', 'mantenimiento', 'desmantelado'];

export default function BusesPage() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    patente: '',
    estado: '',
    anio: '',
    marca: '',
  });

  const [formData, setFormData] = useState({
    patente: '',
    patente_verificador: '',
    marca: '',
    modelo: '',
    anio: '',
    numero_serie: '',
    numero_motor: '',
    capacidad_pasajeros: '',
    fecha_adquisicion: '',
    estado: 'operativo',
    proxima_revision_tecnica: '',
    ultima_revision_tecnica: '',
    documento_revision_tecnica: '',
    vencimiento_seguro: '',
    numero_permiso_circulacion: '',
    numero_soap: '',
    observaciones: '',
    kilometraje_original: '',
    kilometraje_actual: '',
  });

  useEffect(() => {
    loadBuses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [buses, filters]);

  const loadBuses = async () => {
    try {
      setLoading(true);
      const data = await fetchBuses();
      setBuses(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar buses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = buses;

    if (filters.patente) {
      filtered = filtered.filter(b => 
        b.patente.toLowerCase().includes(filters.patente.toLowerCase())
      );
    }

    if (filters.estado) {
      filtered = filtered.filter(b => b.estado === filters.estado);
    }

    if (filters.anio) {
      filtered = filtered.filter(b => b.anio == filters.anio);
    }

    if (filters.marca) {
      filtered = filtered.filter(b => 
        b.marca.toLowerCase().includes(filters.marca.toLowerCase())
      );
    }

    setFilteredBuses(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleClearFilters = () => {
    setFilters({
      patente: '',
      estado: '',
      anio: '',
      marca: '',
    });
  };

  const handleOpenDialog = (bus = null) => {
    if (bus) {
      setEditingBus(bus);
      setFormData(bus);
    } else {
      setEditingBus(null);
      setFormData({
        patente: '',
        patente_verificador: '',
        marca: '',
        modelo: '',
        anio: '',
        numero_serie: '',
        numero_motor: '',
        capacidad_pasajeros: '',
        fecha_adquisicion: '',
        estado: 'operativo',
        proxima_revision_tecnica: '',
        ultima_revision_tecnica: '',
        documento_revision_tecnica: '',
        vencimiento_seguro: '',
        numero_permiso_circulacion: '',
        numero_soap: '',
        observaciones: '',
        kilometraje_original: '',
        kilometraje_actual: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBus(null);
  };

  const handleSave = async () => {
    try {
      if (editingBus) {
        await updateBus(editingBus.id, formData);
      } else {
        await createBus(formData);
      }
      loadBuses();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await deleteBus(id);
        loadBuses();
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

  const marcas = [...new Set(buses.map(b => b.marca))];
  const anios = [...new Set(buses.map(b => b.anio))].sort((a, b) => b - a);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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

      {/* FILTROS */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </Button>

        {showFilters && (
          <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Buscar por Patente"
                  value={filters.patente}
                  onChange={(e) => handleFilterChange('patente', e.target.value)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.estado}
                    onChange={(e) => handleFilterChange('estado', e.target.value)}
                    label="Estado"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {ESTADOS_BUS.map((e) => (
                      <MenuItem key={e} value={e}>{e}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Año</InputLabel>
                  <Select
                    value={filters.anio}
                    onChange={(e) => handleFilterChange('anio', e.target.value)}
                    label="Año"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {anios.map((a) => (
                      <MenuItem key={a} value={a}>{a}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Marca</InputLabel>
                  <Select
                    value={filters.marca}
                    onChange={(e) => handleFilterChange('marca', e.target.value)}
                    label="Marca"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {marcas.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Button
              onClick={handleClearFilters}
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
            >
              Limpiar Filtros
            </Button>
          </Paper>
        )}

        <Box sx={{ mb: 2, fontSize: '14px', color: '#666' }}>
          Resultados: <strong>{filteredBuses.length}</strong> buses
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Patente</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Marca</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Modelo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Año</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cap.</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Km Orig.</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Km Actual</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rev. Técnica</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">No hay buses</TableCell>
              </TableRow>
            ) : (
              filteredBuses.map((bus) => (
                <TableRow key={bus.id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{bus.patente}</TableCell>
                  <TableCell>{bus.marca}</TableCell>
                  <TableCell>{bus.modelo}</TableCell>
                  <TableCell>{bus.anio}</TableCell>
                  <TableCell>{bus.capacidad_pasajeros}</TableCell>
                  <TableCell>{bus.kilometraje_original}</TableCell>
                  <TableCell>{bus.kilometraje_actual}</TableCell>
                  <TableCell>{bus.proxima_revision_tecnica}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        backgroundColor: bus.estado === 'operativo' ? '#c8e6c9' : bus.estado === 'mantenimiento' ? '#fff9c4' : '#ffccbc',
                        color: bus.estado === 'operativo' ? '#2e7d32' : bus.estado === 'mantenimiento' ? '#f57f17' : '#d84315',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {bus.estado}
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBus ? 'Editar Bus' : 'Nuevo Bus'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patente"
                value={formData.patente}
                onChange={(e) => setFormData({ ...formData, patente: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Verificador"
                value={formData.patente_verificador}
                onChange={(e) => setFormData({ ...formData, patente_verificador: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marca"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Modelo"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Año Fabricación"
                type="number"
                value={formData.anio}
                onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacidad Pasajeros"
                type="number"
                value={formData.capacidad_pasajeros}
                onChange={(e) => setFormData({ ...formData, capacidad_pasajeros: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número Serie"
                value={formData.numero_serie}
                onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número Motor"
                value={formData.numero_motor}
                onChange={(e) => setFormData({ ...formData, numero_motor: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha Adquisición"
                type="date"
                value={formData.fecha_adquisicion}
                onChange={(e) => setFormData({ ...formData, fecha_adquisicion: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Km Original"
                type="number"
                value={formData.kilometraje_original}
                onChange={(e) => setFormData({ ...formData, kilometraje_original: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Km Actual"
                type="number"
                value={formData.kilometraje_actual}
                onChange={(e) => setFormData({ ...formData, kilometraje_actual: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Última Revisión Técnica"
                type="date"
                value={formData.ultima_revision_tecnica}
                onChange={(e) => setFormData({ ...formData, ultima_revision_tecnica: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Próxima Revisión Técnica"
                type="date"
                value={formData.proxima_revision_tecnica}
                onChange={(e) => setFormData({ ...formData, proxima_revision_tecnica: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vencimiento Seguro"
                type="date"
                value={formData.vencimiento_seguro}
                onChange={(e) => setFormData({ ...formData, vencimiento_seguro: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Permiso Circulación"
                value={formData.numero_permiso_circulacion}
                onChange={(e) => setFormData({ ...formData, numero_permiso_circulacion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SOAP"
                value={formData.numero_soap}
                onChange={(e) => setFormData({ ...formData, numero_soap: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
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