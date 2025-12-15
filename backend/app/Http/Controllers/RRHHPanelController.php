<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Empleado;
use App\Models\Conductor;
use App\Models\PermisoLicencia;
use Carbon\Carbon;

class RRHHPanelController extends Controller
{
    /**
     * Dashboard de RRHH
     * GET /api/rrhh/dashboard
     */
    public function dashboard()
    {
        try {
            $hoy = Carbon::today();
            $inicioMes = Carbon::now()->startOfMonth();
            $finMes = Carbon::now()->endOfMonth();

            // Métricas de personal
            $metricas = [
                'empleados_activos' => Empleado::where('estado', 'activo')->count(),
                'empleados_licencia' => Empleado::where('estado', 'licencia')->count(),
                'empleados_suspendidos' => Empleado::where('estado', 'suspendido')->count(),
                'empleados_terminados' => Empleado::where('estado', 'terminado')->count(),

                // Licencias
                'licencias_pendientes' => PermisoLicencia::where('estado', 'solicitado')->count(),
                'licencias_aprobadas_mes' => PermisoLicencia::where('estado', 'aprobado')
                    ->whereBetween('fecha_inicio', [$inicioMes, $finMes])
                    ->count(),

                // Contratos
                'contratos_por_vencer' => Empleado::where('tipo_contrato', 'plazo_fijo')
                    ->where('estado', 'activo')
                    ->whereNotNull('fecha_termino')
                    ->whereBetween('fecha_termino', [$hoy, $hoy->copy()->addDays(30)])
                    ->count(),
            ];

            // Conductores con licencia vencida o por vencer
            $conductoresAlerta = Conductor::whereHas('empleado', function($q) {
                    $q->where('estado', 'activo');
                })
                ->where(function($q) use ($hoy) {
                    $q->where('fecha_vencimiento_licencia', '<', $hoy->copy()->addDays(30));
                })
                ->count();

            // Empleados con muchas licencias (alto ausentismo)
            $fechaInicio = $hoy->copy()->subMonths(3);
            $empleadosAltoRiesgo = Empleado::withCount(['licencias' => function ($q) use ($fechaInicio) {
                    $q->where('estado', 'aprobado')
                      ->where('fecha_inicio', '>=', $fechaInicio);
                }])
                ->having('licencias_count', '>', 5)
                ->count();

            // Obtener notificaciones
            $notificationController = new \App\Http\Controllers\NotificationController();
            $notificationsResponse = $notificationController->index();
            $notificationsData = json_decode($notificationsResponse->getContent(), true);

            return response()->json([
                'success' => true,
                'data' => [
                    'metricas' => $metricas,
                    'alertas' => [
                        'conductores_licencia_alerta' => $conductoresAlerta,
                        'empleados_alto_ausentismo' => $empleadosAltoRiesgo,
                    ],
                    'notifications' => $notificationsData['data'] ?? []
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
