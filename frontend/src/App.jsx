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
import LicenciasPage from './pages/LicenciasPage';
import LiquidacionesPage from './pages/LiquidacionesPage';

// REPORTES (Módulo nuevo)
import ReportesPage from './pages/ReportesPage';
import MisReportesPage from './pages/MisReportesPage';
import AnalisisBusesPage from './pages/AnalisisBusesPage';
import AnalisisMantenimientosPage from './pages/AnalisisMantenimientosPage';
import AlertasPage from './pages/AlertasPage';
import AnalisisRRHHPage from './pages/AnalisisRRHHPage';

// ==========================================
// PANEL CONDUCTOR
// ==========================================
import ConductorDashboardPage from './pages/conductor/ConductorDashboardPage';
import MisTurnosPage from './pages/conductor/MisTurnosPage';
import MisViajesPage from './pages/conductor/MisViajesPage';
import ConductorProfilePage from './pages/conductor/ConductorProfilePage';
import MisLicenciasConductorPage from './pages/conductor/MisLicenciasPage';

// ==========================================
// PANEL ASISTENTE
// ==========================================
import AsistenteDashboardPage from './pages/asistente/AsistenteDashboardPage';
import MisTurnosAsistentePage from './pages/asistente/MisTurnosAsistentePage';
import MisViajesAsistentePage from './pages/asistente/MisViajesAsistentePage';
import AsistenteProfilePage from './pages/asistente/AsistenteProfilePage';
import MisLicenciasAsistentePage from './pages/asistente/MisLicenciasPage';

// ==========================================
// PANEL MECÁNICO
// ==========================================
import MecanicoDashboardPage from './pages/mecanico/MecanicoDashboardPage';
import MisMantencionesPage from './pages/mecanico/MisMantencionesPage';
import MecanicoProfilePage from './pages/mecanico/MecanicoProfilePage';
import MisLicenciasMecanicoPage from './pages/mecanico/MisLicenciasPage';

import { logout, me } from './services/api';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const getRoleId = (userData) => {
    if (!userData) return 0;
    const rawId = userData.rol_id || userData.rol?.id;
    return Number(rawId) || 0;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUserStr = localStorage.getItem('user');
      let localUser = null;

      if (savedUserStr) {
        try {
          localUser = JSON.parse(savedUserStr);
          setUser(localUser);
          setIsAuthenticated(true);
          const localRolId = getRoleId(localUser);
          setCurrentPage(getInitialPage(localRolId));
        } catch (e) {
          console.error("Error parsing saved user", e);
        }
      }

      if (token) {
        try {
          const response = await me();
          if (response.success) {
            setIsAuthenticated(true);
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));

            const apiRolId = getRoleId(response.user);
            if (!localUser || getRoleId(localUser) !== apiRolId) {
              setCurrentPage(getInitialPage(apiRolId));
            }
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
    const id = Number(rolId);
    switch (id) {
      case 1:
      case 2:
      case 6:
        return 'dashboard';
      case 3:
        return 'conductor-dashboard';
      case 4:
        return 'mecanico-dashboard';
      case 5:
        return 'asistente-dashboard';
      default:
        return 'dashboard';
    }
  };

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    const rolId = getRoleId(userData);
    setCurrentPage(getInitialPage(rolId));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentPage('dashboard');
    }
  };

  const renderCurrentPage = () => {
    const rolId = getRoleId(user);

    if (rolId === 3) {
      switch (currentPage) {
        case 'conductor-dashboard':
          return <ConductorDashboardPage onNavigate={setCurrentPage} />;
        case 'conductor-turnos':
          return <MisTurnosPage />;
        case 'conductor-viajes':
          return <MisViajesPage />;
        case 'licencias':
          return <MisLicenciasConductorPage />;
        case 'mis-reportes':
          return <MisReportesPage user={user} />;
        case 'perfil':
          return <ConductorProfilePage onBack={setCurrentPage} />;
        default:
          return <ConductorDashboardPage onNavigate={setCurrentPage} />;
      }
    }

    if (rolId === 4) {
      switch (currentPage) {
        case 'mecanico-dashboard':
          return <MecanicoDashboardPage onNavigate={setCurrentPage} />;
        case 'mecanico-mantenimientos':
          return <MisMantencionesPage />;
        case 'licencias':
          return <MisLicenciasMecanicoPage />;
        case 'mis-reportes':
          return <MisReportesPage user={user} />;
        case 'perfil':
          return <MecanicoProfilePage onBack={setCurrentPage} />;
        default:
          return <MecanicoDashboardPage onNavigate={setCurrentPage} />;
      }
    }

    if (rolId === 5) {
      switch (currentPage) {
        case 'asistente-dashboard':
          return <AsistenteDashboardPage onNavigate={setCurrentPage} />;
        case 'asistente-turnos':
          return <MisTurnosAsistentePage />;
        case 'asistente-viajes':
          return <MisViajesAsistentePage />;
        case 'licencias':
          return <MisLicenciasAsistentePage />;
        case 'mis-reportes':
          return <MisReportesPage user={user} />;
        case 'perfil':
          return <AsistenteProfilePage onBack={setCurrentPage} />;
        default:
          return <AsistenteDashboardPage onNavigate={setCurrentPage} />;
      }
    }

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
      case 'licencias':
        return <LicenciasPage />;
      case 'liquidaciones':
        return <LiquidacionesPage user={user} />;
      case 'reportes':
        return <ReportesPage user={user} />;
      case 'mis-reportes':
        return <MisReportesPage user={user} />;
      case 'analisis-buses':
        return <AnalisisBusesPage />;
      case 'analisis-mantenimientos':
        return <AnalisisMantenimientosPage />;
      case 'alertas':
        return <AlertasPage />;
      case 'analisis-rrhh':
        return <AnalisisRRHHPage />;
      default:
        if (rolId === 4) return <MecanicoDashboardPage onNavigate={setCurrentPage} />;
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

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