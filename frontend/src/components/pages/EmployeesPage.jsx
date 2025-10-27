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

const SAMPLE_EMPLOYEES = [
  { id: 1, nombre: 'Juan Pérez', numeroEmpleado: 'EMP001', fechaContratacion: '2023-01-15', tipoContrato: 'Indefinido', salarioBase: 2500000, estado: 'Activo' },
  { id: 2, nombre: 'María García', numeroEmpleado: 'EMP002', fechaContratacion: '2023-02-20', tipoContrato: 'Plazo Fijo', salarioBase: 2300000, estado: 'Activo' },
  { id: 3, nombre: 'Carlos López', numeroEmpleado: 'EMP003', fechaContratacion: '2023-03-10', tipoContrato: 'Indefinido', salarioBase: 2700000, estado: 'Licencia' },
];

const CONTRATOS = ['Indefinido', 'Plazo Fijo', 'Practicante'];
const ESTADOS = ['Activo', 'Licencia', 'Suspendido', 'Terminado'];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(SAMPLE_EMPLOYEES);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    numeroEmpleado: '',
    fechaContratacion: '',
    tipoContrato: 'Indefinido',
    salarioBase: '',
    estado: 'Activo',
  });

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData(employee);
    } else {
      setEditingEmployee(null);
      setFormData({
        nombre: '',
        numeroEmpleado: '',
        fechaContratacion: '',
        tipoContrato: 'Indefinido',
        salarioBase: '',
        estado: 'Activo',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
  };

  const handleSave = () => {
    if (editingEmployee) {
      setEmployees(employees.map(e => e.id === editingEmployee.id ? { ...e, ...formData } : e));
    } else {
      setEmployees([...employees, { id: Math.max(...employees.map(e => e.id), 0) + 1, ...formData }]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  };

  return (
    <Box>
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
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Número Empleado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Contratación</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo Contrato</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Salario</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.nombre}</TableCell>
                <TableCell>{employee.numeroEmpleado}</TableCell>
                <TableCell>{employee.fechaContratacion}</TableCell>
                <TableCell>{employee.tipoContrato}</TableCell>
                <TableCell align="right">{formatCurrency(employee.salarioBase)}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 0.5,
                      borderRadius: '20px',
                      backgroundColor: employee.estado === 'Activo' ? '#c8e6c9' : '#ffccbc',
                      color: employee.estado === 'Activo' ? '#2e7d32' : '#d84315',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {employee.estado}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(employee)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(employee.id)}
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
          {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
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
            label="Número de Empleado"
            value={formData.numeroEmpleado}
            onChange={(e) => setFormData({ ...formData, numeroEmpleado: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Fecha de Contratación"
            type="date"
            value={formData.fechaContratacion}
            onChange={(e) => setFormData({ ...formData, fechaContratacion: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Contrato</InputLabel>
            <Select
              value={formData.tipoContrato}
              onChange={(e) => setFormData({ ...formData, tipoContrato: e.target.value })}
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
            value={formData.salarioBase}
            onChange={(e) => setFormData({ ...formData, salarioBase: e.target.value })}
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