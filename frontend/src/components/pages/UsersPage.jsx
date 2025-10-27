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

const SAMPLE_USERS = [
  { id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@example.com', rut: '12.345.678-9', rol: 'Admin' },
  { id: 2, nombre: 'María', apellido: 'García', email: 'maria@example.com', rut: '13.456.789-0', rol: 'Supervisor' },
  { id: 3, nombre: 'Carlos', apellido: 'López', email: 'carlos@example.com', rut: '14.567.890-1', rol: 'Conductor' },
  { id: 4, nombre: 'Ana', apellido: 'Martínez', email: 'ana@example.com', rut: '15.678.901-2', rol: 'RRHH' },
];

const ROLES = ['Admin', 'Supervisor', 'Conductor', 'Asistente', 'Mecánico', 'RRHH'];

export default function UsersPage() {
  const [users, setUsers] = useState(SAMPLE_USERS);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    rut: '',
    rol: 'Conductor',
  });

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({ nombre: '', apellido: '', email: '', rut: '', rol: 'Conductor' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSave = () => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
    } else {
      setUsers([...users, { id: Math.max(...users.map(u => u.id), 0) + 1, ...formData }]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <h2>Gestión de Usuarios</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Usuario
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>RUT</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rol</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.nombre} {user.apellido}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.rut}</TableCell>
                <TableCell>{user.rol}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(user.id)}
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
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Apellido"
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="RUT"
            value={formData.rut}
            onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
            margin="normal"
            placeholder="12.345.678-9"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rol</InputLabel>
            <Select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              label="Rol"
            >
              {ROLES.map((rol) => (
                <MenuItem key={rol} value={rol}>{rol}</MenuItem>
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