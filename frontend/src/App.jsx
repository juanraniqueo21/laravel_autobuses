import React, { useState, useEffect } from 'react';
import AuthLayout from './components/layouts/AuthLayout';
import MainLayout from './components/layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RolesPage from "./pages/RolesPage";
import UsersPage from "./pages/UsersPage";
import EmployeesPage from "./pages/EmployeesPage";
import ConductoresPage from "./pages/ConductoresPage";
import AsistentesPage from "./pages/AsistentesPage";
import MecanicosPage from "./pages/MecanicosPage";
import BusesPage from "./pages/BusesPage";
import RoutesPage from "./pages/RoutesPage";
import ViajesPage from "./pages/ViajesPage";
import MantencionesPage from './pages/MantencionesPage';
import LogisticPage from './pages/LogisticPage';
import TurnosPage from './pages/TurnosPage';
import { logout, me } from './services/api';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Verificar autenticación al cargar la app
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // Verificar que el token sigue siendo válido
          const response = await me();
          
          if (response.success) {
            setIsAuthenticated(true);
            setUser(response.user);
          } else {
            // Token inválido, limpiar localStorage
            handleLogout();
          }
        } catch (error) {
          console.error('Error verificando autenticación:', error);
          // Token inválido o expirado
          handleLogout();
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    try {
      // Llamar logout del backend para invalidar el token
      await logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar estado local
      setIsAuthenticated(false);
      setUser(null);
      setCurrentPage('dashboard');
    }
  };

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthLayout>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </AuthLayout>
    );
  }

  return (
    <MainLayout 
      user={user} 
      onLogout={handleLogout}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    >
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'roles' && <RolesPage />}
      {currentPage === 'usuarios' && <UsersPage />}
      {currentPage === 'empleados' && <EmployeesPage />}
      {currentPage === 'conductores' && <ConductoresPage />}
      {currentPage === 'asistentes' && <AsistentesPage />}
      {currentPage === 'mecanicos' && <MecanicosPage />}
      {currentPage === 'buses' && <BusesPage />}
      {currentPage === 'rutas' && <RoutesPage />}
      {currentPage === 'viajes' && <ViajesPage />}
      {currentPage === 'mantenimientos' && <MantencionesPage />}
      {currentPage === 'logistica' && <LogisticPage />}
      {currentPage === 'turnos' && <TurnosPage />}
    </MainLayout>
  );
}

export default App;