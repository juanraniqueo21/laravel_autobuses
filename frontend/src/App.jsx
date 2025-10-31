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
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  {currentPage === 'logistica' && <LogisticPage />}

  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUser = localStorage.getItem('user');
    
    if (savedAuth && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('dashboard');
  };

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
      {/* Aquí irán las otras pages */}
    </MainLayout>
  );
}

export default App;