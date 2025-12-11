<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RolController;
use App\Http\Controllers\BusController;
use App\Http\Controllers\ConductorController;
use App\Http\Controllers\EmpleadoController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RutaController;
use App\Http\Controllers\AsistenteController;
use App\Http\Controllers\ViajeController;
use App\Http\Controllers\MecanicoController;
use App\Http\Controllers\MantenimientoController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AsignacionTurnoController;
use App\Http\Controllers\ConductorPanelController;
use App\Http\Controllers\AsistentePanelController;
use App\Http\Controllers\MecanicoPanelController; // <-- agregado desde el api.php de tu amigo
use App\Http\Controllers\PermisoLicenciaController;
use App\Http\Controllers\LiquidacionController;
use App\Http\Controllers\ReportController; // Controlador de Logística
use App\Http\Controllers\ReporteController; // Controlador de Reportes (Nuevo)
use App\Http\Controllers\RRHHController; // Controlador de RRHH

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
// Se agrega ->name('login') para evitar error "Route [login] not defined"
Route::post('/login', [AuthController::class, 'login'])->name('login');

// ============================================
// RUTAS PROTEGIDAS (requieren JWT token)
// ============================================
Route::middleware('jwt.auth')->group(function () {
    
    // AUTH
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    // ROLES
    Route::get('/roles', [RolController::class, 'index']);
    Route::get('/roles/{id}', [RolController::class, 'show']);
    Route::post('/roles', [RolController::class, 'store']);
    Route::put('/roles/{id}', [RolController::class, 'update']);
    Route::delete('/roles/{id}', [RolController::class, 'destroy']);

    // USUARIOS
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // EMPLEADOS - RUTAS ESPECÍFICAS PRIMERO
    Route::get('/empleados/afps', [EmpleadoController::class, 'getAfps']);
    Route::get('/empleados/isapres', [EmpleadoController::class, 'getIsapres']);
    Route::get('/empleados/activos', [EmpleadoController::class, 'getActivos']);

    // EMPLEADOS - RUTAS GENÉRICAS DESPUÉS
    Route::get('/empleados', [EmpleadoController::class, 'index']);
    Route::get('/empleados/{id}', [EmpleadoController::class, 'show']);
    Route::post('/empleados', [EmpleadoController::class, 'store']);
    Route::put('/empleados/{id}', [EmpleadoController::class, 'update']);
    Route::delete('/empleados/{id}', [EmpleadoController::class, 'destroy']);
    Route::post('/empleados/{id}/baja', [EmpleadoController::class, 'darDeBaja']);

    // CONDUCTORES
    Route::get('/conductores', [ConductorController::class, 'index']);
    Route::get('/conductores/{id}', [ConductorController::class, 'show']);
    Route::post('/conductores', [ConductorController::class, 'store']);
    Route::put('/conductores/{id}', [ConductorController::class, 'update']);
    Route::delete('/conductores/{id}', [ConductorController::class, 'destroy']);

    // CATÁLOGOS BUSES
    Route::get('/buses/catalogos/todos', [BusController::class, 'getCatalogosCompletos']);
    Route::get('/buses/catalogos/marcas/{tipo}', [BusController::class, 'getMarcas']);
    Route::get('/buses/catalogos/modelos/{marcaId}', [BusController::class, 'getModelos']);

    // BUSES
    Route::get('/buses', [BusController::class, 'index']);
    Route::get('/buses/{id}', [BusController::class, 'show']);
    Route::post('/buses', [BusController::class, 'store']);
    Route::put('/buses/{id}', [BusController::class, 'update']);
    Route::post('/buses/{id}/activar-emergencia', [BusController::class, 'activarEmergencia']);
    Route::delete('/buses/{id}', [BusController::class, 'destroy']);

    // RUTAS
    Route::get('/rutas', [RutaController::class, 'index']);
    Route::get('/rutas/activas', [RutaController::class, 'rutasActivas']);
    Route::get('/rutas/{id}', [RutaController::class, 'show']);
    Route::post('/rutas', [RutaController::class, 'store']);
    Route::put('/rutas/{id}', [RutaController::class, 'update']);
    Route::delete('/rutas/{id}', [RutaController::class, 'destroy']);

    // RUTAS PARADAS
    Route::post('/rutas/{rutaId}/paradas', [RutaController::class, 'agregarParada']);
    Route::post('/rutas/{rutaId}/paradas/guardar', [RutaController::class, 'guardarParadas']);
    Route::put('/rutas/{rutaId}/paradas/{paradaId}', [RutaController::class, 'actualizarParada']);
    Route::delete('/rutas/{rutaId}/paradas/{paradaId}', [RutaController::class, 'eliminarParada']);

    // ASISTENTES
    Route::get('/asistentes', [AsistenteController::class, 'index']);
    Route::get('/asistentes/{id}', [AsistenteController::class, 'show']);
    Route::post('/asistentes', [AsistenteController::class, 'store']);
    Route::put('/asistentes/{id}', [AsistenteController::class, 'update']);
    Route::delete('/asistentes/{id}', [AsistenteController::class, 'destroy']);

    // VIAJES
    Route::get('/viajes', [ViajeController::class, 'index']);
    Route::get('/viajes/activos', [ViajeController::class, 'activos']);
    Route::get('/viajes/turno/{turnoId}', [ViajeController::class, 'porTurno']);
    Route::get('/viajes/{id}', [ViajeController::class, 'show']);
    Route::post('/viajes', [ViajeController::class, 'store']);
    Route::put('/viajes/{id}', [ViajeController::class, 'update']);
    Route::post('/viajes/{id}/finalizar', [ViajeController::class, 'finalizar']);
    Route::post('/viajes/{id}/cancelar', [ViajeController::class, 'cancelar']);
    Route::delete('/viajes/{id}', [ViajeController::class, 'destroy']);

    // TURNOS / ROTATIVAS
    Route::get('/turnos/calendario/{anio}/{mes}', [AsignacionTurnoController::class, 'calendario']);
    Route::get('/turnos', [AsignacionTurnoController::class, 'index']);
    Route::get('/turnos/{id}', [AsignacionTurnoController::class, 'show']);
    Route::post('/turnos', [AsignacionTurnoController::class, 'store']);
    Route::put('/turnos/{id}', [AsignacionTurnoController::class, 'update']);
    Route::delete('/turnos/{id}', [AsignacionTurnoController::class, 'destroy']);

    // MECANICOS
    Route::get('/mecanicos', [MecanicoController::class, 'index']);
    Route::get('/mecanicos/{id}', [MecanicoController::class, 'show']);
    Route::post('/mecanicos', [MecanicoController::class, 'store']);
    Route::put('/mecanicos/{id}', [MecanicoController::class, 'update']);
    Route::delete('/mecanicos/{id}', [MecanicoController::class, 'destroy']);

    // MANTENIMIENTOS
    Route::apiResource('mantenimientos', MantenimientoController::class);
    
    // LICENCIAS MÉDICAS Y PERMISOS
    Route::prefix('licencias')->group(function () {
        Route::get('/', [PermisoLicenciaController::class, 'index']);
        Route::get('/mis-licencias', [PermisoLicenciaController::class, 'misLicencias']);
        Route::get('/{id}', [PermisoLicenciaController::class, 'show']);
        Route::post('/', [PermisoLicenciaController::class, 'store']);
        Route::put('/{id}', [PermisoLicenciaController::class, 'update']);
        Route::post('/{id}/aprobar', [PermisoLicenciaController::class, 'aprobar']);
        Route::post('/{id}/rechazar', [PermisoLicenciaController::class, 'rechazar']);
        Route::delete('/{id}', [PermisoLicenciaController::class, 'destroy']);
        Route::get('/{id}/descargar-pdf', [PermisoLicenciaController::class, 'descargarPdf']);
    });
    
    // PANEL CONDUCTOR
    Route::prefix('conductor')->group(function () {
        Route::get('/dashboard', [ConductorPanelController::class, 'dashboard']);
        Route::get('/mis-turnos', [ConductorPanelController::class, 'misTurnos']);
        Route::get('/mis-turnos/{id}', [ConductorPanelController::class, 'verTurno']);
        Route::get('/mis-viajes', [ConductorPanelController::class, 'misViajes']);
        Route::get('/mis-viajes/{id}', [ConductorPanelController::class, 'verViaje']);
    });

    // PANEL ASISTENTE
    Route::prefix('asistente')->group(function () {
        Route::get('/dashboard', [AsistentePanelController::class, 'dashboard']);
        Route::get('/mis-turnos', [AsistentePanelController::class, 'misTurnos']);
        Route::get('/mis-turnos/{id}', [AsistentePanelController::class, 'verTurno']);
        Route::get('/mis-viajes', [AsistentePanelController::class, 'misViajes']);
        Route::get('/mis-viajes/{id}', [AsistentePanelController::class, 'verViaje']);
    });

    // PANEL MECÁNICO (del api.php de tu amigo)
    Route::prefix('mecanico')->group(function () {
        Route::get('/dashboard', [MecanicoPanelController::class, 'dashboard']);
        Route::get('/mis-mantenciones', [MecanicoPanelController::class, 'misMantenciones']);
    });

    // LIQUIDACIONES
    Route::prefix('liquidaciones')->group(function () {
        Route::get('/', [LiquidacionController::class, 'index']);
        Route::get('/estadisticas', [LiquidacionController::class, 'estadisticas']);
        Route::post('/calcular', [LiquidacionController::class, 'calcularLiquidacion']);
        Route::get('/{id}', [LiquidacionController::class, 'show']);
        Route::post('/', [LiquidacionController::class, 'store']);
        Route::put('/{id}', [LiquidacionController::class, 'update']);
        Route::delete('/{id}', [LiquidacionController::class, 'destroy']);
        Route::get('/{id}/pdf', [LiquidacionController::class, 'exportarPDF']);
    });

    // REPORTS / LOGÍSTICA
    Route::prefix('reports')->group(function () {
        Route::get('/logistica', [ReportController::class, 'logistica']);
        Route::get('/viajes-por-dia', [ReportController::class, 'viajesPorDia']);
        Route::get('/estado-buses', [ReportController::class, 'estadoBuses']);
        Route::get('/rutas-activas', [ReportController::class, 'rutasActivas']);
        Route::get('/ocupacion-buses', [ReportController::class, 'ocupacionBuses']);
        Route::get('/exportar-pdf', [ReportController::class, 'exportarPDF']);
    });

    // REPORTES (NUEVO MÓDULO)
    Route::prefix('reportes')->group(function () {
        Route::get('/', [ReporteController::class, 'index']);
        Route::get('/mis-reportes', [ReporteController::class, 'misReportes']);

        // Análisis y BI de tipos de servicio
        Route::get('/rentabilidad-por-tipo-servicio', [ReporteController::class, 'rentabilidadPorTipoServicio']);
        Route::get('/ocupacion-por-tipo-servicio', [ReporteController::class, 'ocupacionPorTipoServicio']);
        Route::get('/resumen-ejecutivo', [ReporteController::class, 'resumenEjecutivo']);

        // Análisis de mantenimientos
        Route::get('/buses-con-mas-mantenimientos', [ReporteController::class, 'busesConMasMantenimientos']);
        Route::get('/tipos-fallas-mas-comunes', [ReporteController::class, 'tiposFallasMasComunes']);
        Route::get('/costos-mantenimiento-por-bus', [ReporteController::class, 'costosMantenimientoPorBus']);
        Route::get('/buses-disponibles-emergencia', [ReporteController::class, 'busesDisponiblesEmergencia']);

        // Dashboard operativo y SLA
        Route::get('/dashboard-operativo', [ReporteController::class, 'dashboardOperativo']);
        Route::get('/puntualidad-sla', [ReporteController::class, 'puntualidadSLA']);

        Route::get('/{id}', [ReporteController::class, 'show']);
        Route::post('/', [ReporteController::class, 'store']);
        Route::put('/{id}', [ReporteController::class, 'update']);
        Route::post('/{id}/aprobar', [ReporteController::class, 'aprobar']);
        Route::post('/{id}/rechazar', [ReporteController::class, 'rechazar']);
        Route::delete('/{id}', [ReporteController::class, 'destroy']);
        Route::get('/{id}/descargar-documento', [ReporteController::class, 'descargarDocumento']);
    });

    // ============================================
    // ALERTAS INTELIGENTES Y PREDICCIONES
    // ============================================
    Route::prefix('alertas')->group(function () {
        Route::get('/', [App\Http\Controllers\AlertasInteligentesController::class, 'obtenerAlertas']);
        Route::get('/predicciones', [App\Http\Controllers\AlertasInteligentesController::class, 'predicciones']);
    });

    // ============================================
    // RECURSOS HUMANOS - ANÁLISIS Y GESTIÓN
    // ============================================
    Route::prefix('rrhh')->group(function () {
        // Alertas de contratos
        Route::get('/alertas-contratos', [RRHHController::class, 'alertasContratos']);

        // Ranking de licencias
        Route::get('/ranking-licencias', [RRHHController::class, 'rankingLicencias']);

        // Resumen de contratos
        Route::get('/resumen-contratos', [RRHHController::class, 'resumenContratos']);

        // Empleados con alto riesgo de no renovación
        Route::get('/empleados-alto-riesgo', [RRHHController::class, 'empleadosAltoRiesgo']);
    });

});