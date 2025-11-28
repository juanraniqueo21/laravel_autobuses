import React, { useState, useEffect } from 'react';
import AuthLayout from './components/layouts/AuthLayout';
import MainLayout from './components/layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import { NotificationProvider } from './context/NotificationContext';

// ==========================================
// PÁGINAS ADMIN / GERENTE / RRHH
// ==========================================
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
import LicenciasPage from './pages/LicenciasPage';           // 🔵 Licencias (Admin / Gerente / RRHH)
import LiquidacionesPage from './pages/LiquidacionesPage';   // 🟢 Liquidaciones

// ==========================================
// PANEL CONDUCTOR
// ==========================================
import ConductorDashboardPage from './pages/conductor/ConductorDashboardPage';
import MisTurnosPage from './pages/conductor/MisTurnosPage';
import MisViajesPage from './pages/conductor/MisViajesPage';
import ConductorProfilePage from './pages/conductor/ConductorProfilePage';
import MisLicenciasConductorPage from './pages/conductor/MisLicenciasPage'; // 🔵 Mis licencias Conductor

// ==========================================
// PANEL ASISTENTE
// ==========================================
import AsistenteDashboardPage from './pages/asistente/AsistenteDashboardPage';
import MisTurnosAsistentePage from './pages/asistente/MisTurnosAsistentePage';
import MisViajesAsistentePage from './pages/asistente/MisViajesAsistentePage';
import AsistenteProfilePage from './pages/asistente/AsistenteProfilePage';
import MisLicenciasAsistentePage from './pages/asistente/MisLicenciasPage'; // 🔵 Mis licencias Asistente

import { logout, me } from './services/api';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // ================================
  // VERIFICAR AUTENTICACIÓN
  // ================================
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const response = await me();
          if (response.success) {
            setIsAuthenticated(true);
            setUser(response.user);
            setCurrentPage(getInitialPage(response.user.rol_id || response.user.rol?.id));
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Error verificando autenticación:', error);
          handleLogout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const getInitialPage = (rolId) => {
    switch (rolId) {
      case 1: // Admin
      case 2: // Gerente
      case 6: // RRHH
        return 'dashboard';
      case 3: // Conductor
        return 'conductor-dashboard';
      case 4: // Mecánico
        return 'mecanico-dashboard';
      case 5: // Asistente
        return 'asistente-dashboard';
      default:
        return 'dashboard';
    }
  };

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentPage(getInitialPage(userData.rol_id || userData.rol?.id));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setCurrentPage('dashboard');
    }
  };

  // ==========================================
  // RENDERIZAR PÁGINA SEGÚN ROL Y PERMISOS
  // ==========================================
  const renderCurrentPage = () => {
    const rolId = user?.rol_id || user?.rol?.id;

    // ==========================================
    // PANEL CONDUCTOR (rol_id = 3)
    // ==========================================
    if (rolId === 3) {
      switch (currentPage) {
        case 'conductor-dashboard': 
          return <ConductorDashboardPage onNavigate={setCurrentPage} />;
        case 'conductor-turnos':    
          return <MisTurnosPage />;
        case 'conductor-viajes':    
          return <MisViajesPage />;
        case 'licencias':           // 🔵 Mis licencias conductor
          return <MisLicenciasConductorPage />;
        case 'perfil':              
          return <ConductorProfilePage onBack={setCurrentPage} />;
        default:                    
          return <ConductorDashboardPage onNavigate={setCurrentPage} />;
      }
    }

    // ==========================================
    // PANEL MECÁNICO (rol_id = 4)
    // ==========================================
    if (rolId === 4) {
      return (
        <div className="p-8 bg-gray-50 min-h-screen">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded-lg">
            <h1 className="text-2xl font-bold mb-2">⚙️ Panel Mecánico</h1>
            <p>Este panel está en construcción.</p>
          </div>
        </div>
      );
    }

    // ==========================================
    // PANEL ASISTENTE (rol_id = 5)
    // ==========================================
    if (rolId === 5) {
      switch (currentPage) {
        case 'asistente-dashboard': 
          return <AsistenteDashboardPage onNavigate={setCurrentPage} />;
        case 'asistente-turnos':    
          return <MisTurnosAsistentePage />;
        case 'asistente-viajes':    
          return <MisViajesAsistentePage />;
        case 'licencias':           // 🔵 Mis licencias asistente
          return <MisLicenciasAsistentePage />;
        case 'perfil':              
          return <AsistenteProfilePage onBack={setCurrentPage} />;
        default:                    
          return <AsistenteDashboardPage onNavigate={setCurrentPage} />;
      }
    }

    // ==========================================
    // ADMIN / GERENTE / RRHH (rol_id = 1, 2, 6)
    // ==========================================
    switch (currentPage) {
      case 'dashboard':      
        return <DashboardPage onNavigate={setCurrentPage} />;
      
      case 'roles':          
        return <RolesPage />;
      
      case 'usuarios':       
        return <UsersPage />;
      
      case 'empleados':      
        return <EmployeesPage />;
      
      case 'conductores':    
        return <ConductoresPage />;
      
      case 'asistentes':     
        return <AsistentesPage />;
      
      case 'mecanicos':      
        return <MecanicosPage />;
      
      case 'buses':          
        return <BusesPage />;
      
      case 'rutas':          
        return <RoutesPage />;
      
      case 'viajes':         
        return <ViajesPage />;
      
      case 'mantenimientos': 
        return <MantencionesPage />;
      
      case 'logistica':      
        return <LogisticPage />;
      
      case 'turnos':         
        return <TurnosPage />;

      case 'licencias':      // 🔵 Gestión de licencias (RRHH / Admin / Gerente)
        return <LicenciasPage />;

      // 🟢 LIQUIDACIONES: Admin (1), Gerente (2), RRHH (6)
      case 'liquidaciones':
        return <LiquidacionesPage user={user} />;

      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  // ==========================================
  // ESTADOS DE CARGA Y AUTENTICACIÓN
  // ==========================================
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

  // ==========================================
  // APLICACIÓN PRINCIPAL
  // ==========================================
  return (
    <NotificationProvider>
      <MainLayout 
        user={user}
        onLogout={handleLogout}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      >
        {renderCurrentPage()}
      </MainLayout>
    </NotificationProvider>
  );
}

export default App;
