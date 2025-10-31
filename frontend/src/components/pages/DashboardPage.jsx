import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  People as PeopleIcon,
  DirectionsBus as BusIcon,
  LocalShipping as ViajeIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { fetchConductores, fetchAsistentes, fetchBuses, fetchViajes } from '../../services/api';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [metrics, setMetrics] = useState({
    conductoresTotal: 0,
    conductoresActivos: 0,
    conductoresLicenciaVencida: 0,
    asistentesTotal: 0,
    asistentesActivos: 0,
    busesTotal: 0,
    busesOperativos: 0,
    busesMantenimiento: 0,
    viajesHoy: 0,
    viajesCompletados: 0,
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [conductoresData, asistentesData, busesData, viajesData] = await Promise.all([
        fetchConductores(),
        fetchAsistentes(),
        fetchBuses(),
        fetchViajes(),
      ]);

      const today = new Date().toISOString().split('T')[0];

      // Calcular métricas conductores
      const conductoresActivos = conductoresData.filter(c => c.estado === 'activo').length;
      const conductoresLicenciaVencida = conductoresData.filter(c => {
        const vencimiento = new Date(c.fecha_vencimiento_licencia);
        return vencimiento < new Date();
      }).length;

      // Calcular métricas asistentes
      const asistentesActivos = asistentesData.filter(a => a.estado === 'activo').length;

      // Calcular métricas buses
      const busesOperativos = busesData.filter(b => b.estado === 'operativo').length;
      const busesMantenimiento = busesData.filter(b => b.estado === 'mantenimiento').length;

      // Calcular viajes hoy
      const viajesHoy = viajesData.filter(v => v.fecha_hora_salida.split('T')[0] === today).length;
      const viajesCompletados = viajesData.filter(v => v.estado === 'completado').length;

      setMetrics({
        conductoresTotal: conductoresData.length,
        conductoresActivos,
        conductoresLicenciaVencida,
        asistentesTotal: asistentesData.length,
        asistentesActivos,
        busesTotal: busesData.length,
        busesOperativos,
        busesMantenimiento,
        viajesHoy,
        viajesCompletados,
      });

      setError(null);
    } catch (err) {
      setError('Error al cargar métricas: ' + err.message);
    } finally {
      setLoading(false);
    }
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

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Métricas" />
        <Tab label="Logística" />
      </Tabs>

      {/* TAB 1: MÉTRICAS */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* CONDUCTORES */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Conductores
                    </Typography>
                    <Typography variant="h5">{metrics.conductoresTotal}</Typography>
                    <Typography variant="caption" color="success.main">
                      {metrics.conductoresActivos} activos
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* CONDUCTORES LICENCIA VENCIDA */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: metrics.conductoresLicenciaVencida > 0 ? '#ffebee' : '#f5f5f5' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Licencias Vencidas
                    </Typography>
                    <Typography variant="h5" sx={{ color: metrics.conductoresLicenciaVencida > 0 ? '#d32f2f' : '#333' }}>
                      {metrics.conductoresLicenciaVencida}
                    </Typography>
                    <Typography variant="caption" color="error">
                      ⚠️ Requiere atención
                    </Typography>
                  </Box>
                  <WarningIcon sx={{ fontSize: 40, color: '#d32f2f' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ASISTENTES */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Asistentes
                    </Typography>
                    <Typography variant="h5">{metrics.asistentesTotal}</Typography>
                    <Typography variant="caption" color="success.main">
                      {metrics.asistentesActivos} activos
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, color: '#388e3c' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* BUSES */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Buses
                    </Typography>
                    <Typography variant="h5">{metrics.busesTotal}</Typography>
                    <Typography variant="caption" color="success.main">
                      {metrics.busesOperativos} operativos
                    </Typography>
                  </Box>
                  <BusIcon sx={{ fontSize: 40, color: '#f57c00' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* BUSES EN MANTENIMIENTO */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ backgroundColor: metrics.busesMantenimiento > 0 ? '#fff3e0' : '#f5f5f5' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      En Mantenimiento
                    </Typography>
                    <Typography variant="h5">{metrics.busesMantenimiento}</Typography>
                    <Typography variant="caption" color="warning.main">
                      Fuera de servicio
                    </Typography>
                  </Box>
                  <BusIcon sx={{ fontSize: 40, color: '#f57c00' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* VIAJES HOY */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Viajes Hoy
                    </Typography>
                    <Typography variant="h5">{metrics.viajesHoy}</Typography>
                    <Typography variant="caption" color="info.main">
                      Programados
                    </Typography>
                  </Box>
                  <ViajeIcon sx={{ fontSize: 40, color: '#7b1fa2' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* VIAJES COMPLETADOS */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Viajes Completados
                    </Typography>
                    <Typography variant="h5">{metrics.viajesCompletados}</Typography>
                    <Typography variant="caption" color="success.main">
                      ✅ Exitosos
                    </Typography>
                  </Box>
                  <ViajeIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 2: LOGÍSTICA */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h6">Gráficos de Logística (próximamente)</Typography>
          <Typography color="textSecondary">
            Aquí irán: Viajes por día, Ingresos esperados, etc.
          </Typography>
        </Box>
      )}
    </Box>
  );
}