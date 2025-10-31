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
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { fetchEmpleados,fetchUsers, createEmpleado, updateEmpleado, deleteEmpleado } from '../../services/api';

const CONTRATOS = ['indefinido', 'plazo_fijo', 'practicante'];
const ESTADOS = ['activo', 'licencia', 'suspendido', 'terminado'];

export default function EmployeesPage() {
  const [empleados, setEmpleados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [searchUsuario, setSearchUsuario] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    numero_empleado: '',
    fecha_contratacion: '',
    tipo_contrato: 'indefinido',
    salario_base: '',
    estado: 'activo',
  });

  useEffect(() => {
    loadEmpleados();
  }, []);

  const loadEmpleados = async () => {
    try {
      setLoading(true);
      const [empleadosData, usuariosData] = await Promise.all([
        fetchEmpleados(), 
        fetchUsers()
      ]);
      setEmpleados(empleadosData);
      setUsuarios(usuariosData);
      setError(null);
    } catch (err) {
      setError('Error al cargar empleados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (empleado = null) => {
    if (empleado) {
      setEditingEmpleado(empleado);
      setFormData(empleado);
    } else {
      setEditingEmpleado(null);
      setFormData({
        user_id: '',
        numero_empleado: '',
        fecha_contratacion: '',
        tipo_contrato: 'indefinido',
        salario_base: '',
        estado: 'activo',
      });
    }
    setSearchUsuario('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmpleado(null);
    setSearchUsuario('');
  };

  const handleSave = async () => {
    try {
      if (editingEmpleado) {
        await updateEmpleado(editingEmpleado.id, formData);
      } else {
        await createEmpleado(formData);
      }
      loadEmpleados();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await deleteEmpleado(id);
        loadEmpleados();
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  const getUsuariosFiltrados = () => {
    return usuarios.filter(user => {
      const rol = user.rol?.nombre?.toLowerCase() || '';
      const busqueda = searchUsuario.toLowerCase();
      
      if (busqueda) {
        return rol.includes(busqueda);
      }
      return true;
    });
  };

  const getNombreUsuario = (userId) => {
    const user = usuarios.find(u => u.id === userId);
    return user ? `${user.nombre} ${user.apellido}` : 'N/A';
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
        <h2>Gestión de Empleados</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Empleado
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuario</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Número Empleado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha Contratación</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo Contrato</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Salario</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empleados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No hay empleados</TableCell>
              </TableRow>
            ) : (
              empleados.map((empleado) => (
                <TableRow key={empleado.id}>
                  <TableCell>{getNombreUsuario(empleado.user_id)}</TableCell>
                  <TableCell>{empleado.numero_empleado}</TableCell>
                  <TableCell>{empleado.fecha_contratacion}</TableCell>
                  <TableCell>{empleado.tipo_contrato}</TableCell>
                  <TableCell align="right">{formatCurrency(empleado.salario_base)}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        backgroundColor: empleado.estado === 'activo' ? '#c8e6c9' : '#ffccbc',
                        color: empleado.estado === 'activo' ? '#2e7d32' : '#d84315',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {empleado.estado}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(empleado)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(empleado.id)}
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
          {editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Filtrar por Rol</InputLabel>
            <Select
              value={searchUsuario}
              onChange={(e) => setSearchUsuario(e.target.value)}
              label="Filtrar por Rol"
            >
              <MenuItem value="">Todos los usuarios</MenuItem>
              <MenuItem value="admin">Administradores</MenuItem>
              <MenuItem value="conductor">Conductores</MenuItem>
              <MenuItem value="mecanico">Mecánicos</MenuItem>
              <MenuItem value="asistente">Asistentes</MenuItem>
              <MenuItem value="rrhh">RRHH</MenuItem>
              <MenuItem value="gerente">Gerentes</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Usuario</InputLabel>
            <Select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              label="Usuario"
            >
              <MenuItem value="">Seleccione un usuario</MenuItem>
              {getUsuariosFiltrados().map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Box>
                    <Box sx={{ fontWeight: 'bold' }}>
                      {user.nombre} {user.apellido}
                    </Box>
                    <Box sx={{ fontSize: '0.85rem', color: 'gray' }}>
                      ID: {user.id} | Email: {user.email} | Rol: {user.rol?.nombre}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Número de Empleado"
            value={formData.numero_empleado}
            onChange={(e) => setFormData({ ...formData, numero_empleado: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Fecha de Contratación"
            type="date"
            value={formData.fecha_contratacion}
            onChange={(e) => setFormData({ ...formData, fecha_contratacion: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Contrato</InputLabel>
            <Select
              value={formData.tipo_contrato}
              onChange={(e) => setFormData({ ...formData, tipo_contrato: e.target.value })}
              label="Tipo de Contrato"
            >
              {CONTRATOS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Salario Base (CLP)"
            type="number"
            value={formData.salario_base}
            onChange={(e) => setFormData({ ...formData, salario_base: parseInt(e.target.value) })}
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