<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bus;
use App\Models\Empleado;
use App\Models\Viaje;
use App\Models\Mantenimiento;
use App\Models\AsignacionTurno;
use App\Models\PermisoLicencia;
use Carbon\Carbon;

class GerentePanelController extends Controller
{
    /**
     * Dashboard del Gerente
     * GET /api/gerente/dashboard
     */
    public function dashboard()
    {
        try {
            $hoy = Carbon::today();
            $inicioMes = Carbon::now()->startOfMonth();
            $finMes = Carbon::now()->endOfMonth();

            // Métricas generales
            $metricas = [
                'buses_operativos' => Bus::where('estado', 'operativo')->count(),
                'buses_mantenimiento' => Bus::where('estado', 'mantenimiento')->count(),
                'empleados_activos' => Empleado::where('estado', 'activo')->count(),
                'turnos_hoy' => AsignacionTurno::whereDate('fecha_turno', $hoy)
                    ->whereIn('estado', ['programado', 'en_curso'])
                    ->count(),
                'viajes_completados_mes' => Viaje::where('estado', 'completado')
                    ->whereHas('asignacionTurno', function($q) use ($inicioMes, $finMes) {
                        $q->whereBetween('fecha_turno', [$inicioMes, $finMes]);
                    })
                    ->count(),
                'mantenimientos_activos' => Mantenimiento::where('estado', 'en_proceso')->count(),
                'licencias_pendientes' => PermisoLicencia::where('estado', 'solicitado')->count(),
            ];

            // Buses con problemas
            $busesConProblemas = Bus::where(function($q) use ($hoy) {
                $q->where('proxima_revision_tecnica', '<', $hoy)
                  ->orWhere('vencimiento_soap', '<', $hoy)
                  ->orWhere('vencimiento_poliza', '<', $hoy);
            })->count();

            // Viajes con diferencia de recaudación
            $viajesRecaudacionCritica = Viaje::where('requiere_revision', true)
                ->where('estado', 'completado')
                ->whereDate('created_at', '>=', $hoy->copy()->subDays(7))
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
                        'buses_con_problemas' => $busesConProblemas,
                        'recaudacion_critica' => $viajesRecaudacionCritica,
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
