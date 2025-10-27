import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  CssBaseline,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  DirectionsBus as BusIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import RolesPage from './pages/RolesPage';
import UsersPage from './pages/UsersPage';
import EmployeesPage from './pages/EmployeesPage';
import ConductorsPage from './pages/ConductoresPage';
import BusesPage from './pages/BusesPage';
import RoutesPage from './pages/RoutesPage';
import MaintenancePage from './pages/MantencionesPage';
import TripsPage from './pages/ViajesPage';



const DRAWER_WIDTH = 240;

export default function Layout() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [anchorEl, setAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'roles', label: 'Roles', icon: <SecurityIcon /> },
    { id: 'users', label: 'Usuarios', icon: <PeopleIcon /> },
    { id: 'employees', label: 'Empleados', icon: <PeopleIcon /> },
    { id: 'conductors', label: 'Conductores', icon: <BusIcon /> },
    { id: 'buses', label: 'Buses', icon: <BusIcon /> },
    { id: 'routes', label: 'Rutas', icon: <BusIcon /> },
    { id: 'mantenciones', label: 'Mantenimiento', icon: <SettingsIcon /> },
    { id: 'viajes', label: 'Viajes', icon: <BusIcon /> },
    { id: 'settings', label: 'Configuración', icon: <SettingsIcon /> },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'roles':
        return <RolesPage />;
      case 'users':
        return <UsersPage />;
      case 'employees':
        return <EmployeesPage />;
      case 'conductors':
        return <ConductorsPage />;
      case 'buses':
        return <BusesPage />;
      case 'routes':
        return <RoutesPage />;
      case 'mantenciones':
        return <MaintenancePage />; 
      case 'viajes':
        return <TripsPage />;
        
      default:
        return (
          <Box sx={{ p: 3 }}>
            <h1>Dashboard - Gestión de Buses</h1>
            <p>Bienvenido al sistema de gestión de buses</p>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* AppBar */}
      <AppBar position="fixed" sx={{ width: `calc(100% - ${DRAWER_WIDTH}px)`, ml: `${DRAWER_WIDTH}px` }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <h2 style={{ margin: 0 }}>Gestión de Buses</h2>
          </Box>
          <Avatar
            onClick={handleProfileMenuOpen}
            sx={{ cursor: 'pointer', bgcolor: '#1976d2' }}
          >
            AD
          </Avatar>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={handleProfileMenuClose}>Mi Perfil</MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>Configuración</MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <LogoutIcon sx={{ mr: 1 }} />
              Salir
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            mt: 8,
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              sx={{
                backgroundColor: currentPage === item.id ? '#f0f0f0' : 'transparent',
                borderLeft: currentPage === item.id ? '4px solid #1976d2' : 'none',
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#fafafa',
          p: 3,
          mt: 8,
          minHeight: '100vh',
        }}
      >
        {renderPage()}
      </Box>
    </Box>
  );
}