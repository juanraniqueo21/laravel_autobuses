<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Empleado;
use App\Models\Conductor;
use App\Models\Asistente;
use App\Models\Mecanico;
use App\Models\Bus;
use App\Models\Mantenimiento;
use App\Models\PermisoLicencia;
use App\Models\AsignacionTurno;
use App\Models\TurnoConductor;
use App\Models\TurnoAsistente;
use App\Models\Viaje;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Obtener notificaciones del usuario autenticado
     * GET /api/notifications
     */
    public function index()
    {
        try {
            $user = Auth::user();
            $rol = strtolower($user->rol->nombre ?? '');

            $notifications = [];

            // Generar notificaciones según rol
            switch ($rol) {
                case 'conductor':
                    $notifications = $this->getConductorNotifications($user);
                    break;
                case 'mecanico':
                    $notifications = $this->getMecanicoNotifications($user);
                    break;
                case 'asistente':
                    $notifications = $this->getAsistenteNotifications($user);
                    break;
                case 'rrhh':
                    $notifications = $this->getRRHHNotifications($user);
                    break;
                case 'gerente':
                    $notifications = $this->getGerenteNotifications($user);
                    break;
                case 'admin':
                    $notifications = $this->getAdminNotifications($user);
                    break;
                default:
                    $notifications = [];
            }

            // Agrupar por tipo
            $grouped = [
                'critical' => array_filter($notifications, fn($n) => $n['priority'] === 'critical'),
                'warning' => array_filter($notifications, fn($n) => $n['priority'] === 'warning'),
                'info' => array_filter($notifications, fn($n) => $n['priority'] === 'info'),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'all' => array_values($notifications),
                    'grouped' => [
                        'critical' => array_values($grouped['critical']),
                        'warning' => array_values($grouped['warning']),
                        'info' => array_values($grouped['info']),
                    ],
                    'count' => [
                        'total' => count($notifications),
                        'critical' => count($grouped['critical']),
                        'warning' => count($grouped['warning']),
                        'info' => count($grouped['info']),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener notificaciones',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Notificaciones para Conductores
     */
    private function getConductorNotifications($user)
    {
        $notifications = [];
        $empleado = Empleado::where('user_id', $user->id)->first();

        if (!$empleado) return $notifications;

        $conductor = Conductor::where('empleado_id', $empleado->id)->first();
        if (!$conductor) return $notifications;

        $hoy = Carbon::today();

        // 1. Licencia de conducir por vencer (30 días)
        if ($conductor->fecha_vencimiento_licencia) {
            $diasParaVencer = Carbon::parse($conductor->fecha_vencimiento_licencia)->diffInDays($hoy, false);

            if ($diasParaVencer <= 30 && $diasParaVencer >= 0) {
                $notifications[] = [
                    'id' => 'licencia_vencer_' . $conductor->id,
                    'type' => 'license_expiring',
                    'priority' => $diasParaVencer <= 7 ? 'critical' : 'warning',
                    'title' => 'Licencia de conducir por vencer',
                    'message' => "Tu licencia vence en {$diasParaVencer} días (" . Carbon::parse($conductor->fecha_vencimiento_licencia)->format('d/m/Y') . ")",
                    'icon' => 'card',
                    'action_url' => '/conductor/perfil',
                    'created_at' => now()->toISOString()
                ];
            } elseif ($diasParaVencer < 0) {
                $notifications[] = [
                    'id' => 'licencia_vencida_' . $conductor->id,
                    'type' => 'license_expired',
                    'priority' => 'critical',
                    'title' => 'Licencia de conducir VENCIDA',
                    'message' => 'Tu licencia venció hace ' . abs($diasParaVencer) . ' días. No puedes conducir.',
                    'icon' => 'alert-triangle',
                    'action_url' => '/conductor/perfil',
                    'created_at' => now()->toISOString()
                ];
            }
        }

        // 2. Certificado RCP vencido o por vencer
        if ($conductor->vencimiento_rcp) {
            $diasParaVencer = Carbon::parse($conductor->vencimiento_rcp)->diffInDays($hoy, false);

            if ($diasParaVencer <= 30 && $diasParaVencer >= 0) {
                $notifications[] = [
                    'id' => 'rcp_vencer_' . $conductor->id,
                    'type' => 'certificate_expiring',
                    'priority' => $diasParaVencer <= 7 ? 'warning' : 'info',
                    'title' => 'Certificado RCP por vencer',
                    'message' => "Renueva tu certificado RCP. Vence en {$diasParaVencer} días",
                    'icon' => 'heart',
                    'action_url' => '/conductor/perfil',
                    'created_at' => now()->toISOString()
                ];
            } elseif ($diasParaVencer < 0) {
                $notifications[] = [
                    'id' => 'rcp_vencido_' . $conductor->id,
                    'type' => 'certificate_expired',
                    'priority' => 'warning',
                    'title' => 'Certificado RCP vencido',
                    'message' => 'Tu certificado RCP está vencido desde hace ' . abs($diasParaVencer) . ' días',
                    'icon' => 'alert-circle',
                    'action_url' => '/conductor/perfil',
                    'created_at' => now()->toISOString()
                ];
            }
        }

        // 3. Certificado Defensa Pasajeros
        if ($conductor->vencimiento_defensa) {
            $diasParaVencer = Carbon::parse($conductor->vencimiento_defensa)->diffInDays($hoy, false);

            if ($diasParaVencer <= 30 && $diasParaVencer >= 0) {
                $notifications[] = [
                    'id' => 'defensa_vencer_' . $conductor->id,
                    'type' => 'certificate_expiring',
                    'priority' => $diasParaVencer <= 7 ? 'warning' : 'info',
                    'title' => 'Certificado Defensa por vencer',
                    'message' => "Renueva tu certificado. Vence en {$diasParaVencer} días",
                    'icon' => 'shield',
                    'action_url' => '/conductor/perfil',
                    'created_at' => now()->toISOString()
                ];
            }
        }

        // 4. Infracciones acumuladas
        if ($conductor->cantidad_infracciones >= 3) {
            $notifications[] = [
                'id' => 'infracciones_' . $conductor->id,
                'type' => 'infractions',
                'priority' => $conductor->cantidad_infracciones >= 5 ? 'critical' : 'warning',
                'title' => 'Infracciones acumuladas',
                'message' => "Tienes {$conductor->cantidad_infracciones} infracciones registradas",
                'icon' => 'alert-octagon',
                'action_url' => '/conductor/historial',
                'created_at' => now()->toISOString()
            ];
        }

        // 5. Turnos próximos (hoy y mañana)
        $turnoIds = TurnoConductor::where('conductor_id', $conductor->id)
            ->pluck('asignacion_turno_id');

        $turnosProximos = AsignacionTurno::with('bus')
            ->whereIn('id', $turnoIds)
            ->whereBetween('fecha_turno', [$hoy, $hoy->copy()->addDays(1)])
            ->where('estado', 'programado')
            ->get();

        foreach ($turnosProximos as $turno) {
            $esHoy = Carbon::parse($turno->fecha_turno)->isToday();
            $notifications[] = [
                'id' => 'turno_' . $turno->id,
                'type' => 'shift_upcoming',
                'priority' => $esHoy ? 'warning' : 'info',
                'title' => $esHoy ? 'Turno hoy' : 'Turno mañana',
                'message' => "Bus {$turno->bus->patente} a las {$turno->hora_inicio}",
                'icon' => 'clock',
                'action_url' => '/conductor/turnos/' . $turno->id,
                'created_at' => now()->toISOString()
            ];
        }

        return $notifications;
    }

    /**
     * Notificaciones para Mecánicos
     */
    private function getMecanicoNotifications($user)
    {
        $notifications = [];
        $empleado = Empleado::where('user_id', $user->id)->first();

        if (!$empleado) return $notifications;

        $mecanico = Mecanico::where('empleado_id', $empleado->id)->first();
        if (!$mecanico) return $notifications;

        // 1. Mantenimientos en proceso asignados
        $mantenimientosActivos = Mantenimiento::with('bus')
            ->where('mecanico_id', $mecanico->id)
            ->where('estado', 'en_proceso')
            ->get();

        foreach ($mantenimientosActivos as $mant) {
            $diasDesdeInicio = Carbon::parse($mant->fecha_inicio)->diffInDays(Carbon::today());

            $notifications[] = [
                'id' => 'mantenimiento_' . $mant->id,
                'type' => 'maintenance_active',
                'priority' => $diasDesdeInicio > 3 ? 'warning' : 'info',
                'title' => 'Mantenimiento en proceso',
                'message' => "Bus {$mant->bus->patente} - {$mant->tipo_mantenimiento} (hace {$diasDesdeInicio} días)",
                'icon' => 'tool',
                'action_url' => '/mecanico/mantenimientos/' . $mant->id,
                'created_at' => now()->toISOString()
            ];
        }

        // 2. Buses con mantenimiento próximo por km
        $busesCriticos = Bus::where('estado', 'operativo')
            ->whereNotNull('proximo_mantenimiento_km')
            ->whereNotNull('kilometraje_actual')
            ->whereRaw('(proximo_mantenimiento_km - kilometraje_actual) <= 500')
            ->get();

        foreach ($busesCriticos as $bus) {
            $kmFaltantes = $bus->proximo_mantenimiento_km - $bus->kilometraje_actual;

            $notifications[] = [
                'id' => 'bus_km_' . $bus->id,
                'type' => 'maintenance_needed',
                'priority' => $kmFaltantes <= 100 ? 'critical' : 'warning',
                'title' => 'Mantenimiento por km',
                'message' => "Bus {$bus->patente} necesita mantención en {$kmFaltantes} km",
                'icon' => 'activity',
                'action_url' => '/buses/' . $bus->id,
                'created_at' => now()->toISOString()
            ];
        }

        // 3. Buses con aceite crítico
        $busesAceiteCritico = Bus::where('estado', 'operativo')
            ->whereRaw('(kilometraje_actual - kilometraje_ultimo_cambio_aceite) >= 8000')
            ->get();

        foreach ($busesAceiteCritico as $bus) {
            $notifications[] = [
                'id' => 'aceite_' . $bus->id,
                'type' => 'oil_change_needed',
                'priority' => 'critical',
                'title' => 'Cambio de aceite urgente',
                'message' => "Bus {$bus->patente} requiere cambio de aceite YA",
                'icon' => 'droplet',
                'action_url' => '/buses/' . $bus->id,
                'created_at' => now()->toISOString()
            ];
        }

        return $notifications;
    }

    /**
     * Notificaciones para Asistentes
     */
    private function getAsistenteNotifications($user)
    {
        $notifications = [];
        $empleado = Empleado::where('user_id', $user->id)->first();

        if (!$empleado) return $notifications;

        $asistente = Asistente::where('empleado_id', $empleado->id)->first();
        if (!$asistente) return $notifications;

        $hoy = Carbon::today();

        // 1. Turnos próximos (hoy y mañana)
        $turnoIds = TurnoAsistente::where('asistente_id', $asistente->id)
            ->pluck('asignacion_turno_id');

        $turnosProximos = AsignacionTurno::with(['bus', 'conductores.empleado.user'])
            ->whereIn('id', $turnoIds)
            ->whereBetween('fecha_turno', [$hoy, $hoy->copy()->addDays(1)])
            ->where('estado', 'programado')
            ->get();

        foreach ($turnosProximos as $turno) {
            $esHoy = Carbon::parse($turno->fecha_turno)->isToday();
            $conductorPrincipal = $turno->conductores->where('pivot.rol', 'principal')->first();

            $notifications[] = [
                'id' => 'turno_' . $turno->id,
                'type' => 'shift_upcoming',
                'priority' => $esHoy ? 'warning' : 'info',
                'title' => $esHoy ? 'Turno hoy' : 'Turno mañana',
                'message' => "Bus {$turno->bus->patente} a las {$turno->hora_inicio}" .
                            ($conductorPrincipal ? " con {$conductorPrincipal->empleado->user->nombre_completo}" : ""),
                'icon' => 'clock',
                'action_url' => '/asistente/turnos/' . $turno->id,
                'created_at' => now()->toISOString()
            ];
        }

        // 2. Examen ocupacional próximo o vencido
        if ($asistente->fecha_examen_ocupacional) {
            $diasParaVencer = Carbon::parse($asistente->fecha_examen_ocupacional)->diffInDays($hoy, false);

            if ($diasParaVencer <= 60 && $diasParaVencer >= 0) {
                $notifications[] = [
                    'id' => 'examen_vencer_' . $asistente->id,
                    'type' => 'exam_expiring',
                    'priority' => $diasParaVencer <= 30 ? 'warning' : 'info',
                    'title' => 'Examen ocupacional próximo',
                    'message' => "Tu examen se debe renovar en {$diasParaVencer} días",
                    'icon' => 'clipboard',
                    'action_url' => '/asistente/perfil',
                    'created_at' => now()->toISOString()
                ];
            }
        }

        return $notifications;
    }

    /**
     * Notificaciones para RRHH
     */
    private function getRRHHNotifications($user)
    {
        $notifications = [];
        $hoy = Carbon::today();

        // 1. Contratos por vencer (30 días)
        $contratosPorVencer = Empleado::with('user')
            ->where('tipo_contrato', 'plazo_fijo')
            ->where('estado', 'activo')
            ->whereNotNull('fecha_termino')
            ->whereBetween('fecha_termino', [$hoy, $hoy->copy()->addDays(30)])
            ->count();

        if ($contratosPorVencer > 0) {
            $notifications[] = [
                'id' => 'contratos_vencer',
                'type' => 'contracts_expiring',
                'priority' => 'warning',
                'title' => 'Contratos por vencer',
                'message' => "{$contratosPorVencer} contrato(s) vencen en los próximos 30 días",
                'icon' => 'file-text',
                'action_url' => '/rrhh/contratos',
                'created_at' => now()->toISOString()
            ];
        }

        // 2. Licencias pendientes de aprobación
        $licenciasPendientes = PermisoLicencia::with('empleado.user')
            ->where('estado', 'solicitado')
            ->count();

        if ($licenciasPendientes > 0) {
            $notifications[] = [
                'id' => 'licencias_pendientes',
                'type' => 'leaves_pending',
                'priority' => 'warning',
                'title' => 'Licencias pendientes',
                'message' => "{$licenciasPendientes} licencia(s) esperando aprobación",
                'icon' => 'inbox',
                'action_url' => '/licencias',
                'created_at' => now()->toISOString()
            ];
        }

        // 3. Empleados con muchas licencias (>5 en los últimos 3 meses)
        $fechaInicio = $hoy->copy()->subMonths(3);
        $empleadosAltoRiesgo = Empleado::withCount(['licencias' => function ($q) use ($fechaInicio) {
                $q->where('estado', 'aprobado')
                  ->where('fecha_inicio', '>=', $fechaInicio);
            }])
            ->having('licencias_count', '>', 5)
            ->count();

        if ($empleadosAltoRiesgo > 0) {
            $notifications[] = [
                'id' => 'empleados_alto_riesgo',
                'type' => 'high_risk_employees',
                'priority' => 'info',
                'title' => 'Empleados con ausentismo alto',
                'message' => "{$empleadosAltoRiesgo} empleado(s) con más de 5 licencias en 3 meses",
                'icon' => 'user-x',
                'action_url' => '/rrhh/analisis',
                'created_at' => now()->toISOString()
            ];
        }

        // 4. Conductores con licencia de conducir vencida
        $conductoresLicenciaVencida = Conductor::whereHas('empleado', function($q) {
                $q->where('estado', 'activo');
            })
            ->where('fecha_vencimiento_licencia', '<', $hoy)
            ->count();

        if ($conductoresLicenciaVencida > 0) {
            $notifications[] = [
                'id' => 'conductores_licencia_vencida',
                'type' => 'driver_license_expired',
                'priority' => 'critical',
                'title' => 'Conductores con licencia vencida',
                'message' => "{$conductoresLicenciaVencida} conductor(es) NO pueden operar",
                'icon' => 'alert-triangle',
                'action_url' => '/conductores',
                'created_at' => now()->toISOString()
            ];
        }

        return $notifications;
    }

    /**
     * Notificaciones para Gerente
     */
    private function getGerenteNotifications($user)
    {
        $notifications = [];
        $hoy = Carbon::today();

        // 1. Buses no operativos
        $busesNoOperativos = Bus::whereIn('estado', ['mantenimiento', 'desmantelado'])->count();

        if ($busesNoOperativos > 0) {
            $notifications[] = [
                'id' => 'buses_no_operativos',
                'type' => 'buses_down',
                'priority' => $busesNoOperativos >= 5 ? 'critical' : 'warning',
                'title' => 'Buses no operativos',
                'message' => "{$busesNoOperativos} buses fuera de servicio",
                'icon' => 'truck',
                'action_url' => '/buses',
                'created_at' => now()->toISOString()
            ];
        }

        // 2. Viajes con recaudación crítica (>20% diferencia)
        $viajesCriticos = Viaje::where('estado', 'completado')
            ->where('requiere_revision', true)
            ->whereDate('created_at', '>=', $hoy->copy()->subDays(7))
            ->count();

        if ($viajesCriticos > 0) {
            $notifications[] = [
                'id' => 'recaudacion_critica',
                'type' => 'collection_critical',
                'priority' => 'critical',
                'title' => 'Recaudación con diferencias',
                'message' => "{$viajesCriticos} viaje(s) con diferencia >20% en la semana",
                'icon' => 'dollar-sign',
                'action_url' => '/viajes?requiere_revision=true',
                'created_at' => now()->toISOString()
            ];
        }

        // 3. Buses con revisión técnica vencida
        $busesRevisionVencida = Bus::where('proxima_revision_tecnica', '<', $hoy)
            ->where('estado', 'operativo')
            ->count();

        if ($busesRevisionVencida > 0) {
            $notifications[] = [
                'id' => 'revision_vencida',
                'type' => 'technical_review_expired',
                'priority' => 'critical',
                'title' => 'Revisión técnica vencida',
                'message' => "{$busesRevisionVencida} bus(es) NO pueden circular",
                'icon' => 'clipboard-check',
                'action_url' => '/buses?revision_vencida=true',
                'created_at' => now()->toISOString()
            ];
        }

        // 4. Buses con SOAP vencido
        $busesSoapVencido = Bus::where('vencimiento_soap', '<', $hoy)
            ->where('estado', 'operativo')
            ->count();

        if ($busesSoapVencido > 0) {
            $notifications[] = [
                'id' => 'soap_vencido',
                'type' => 'soap_expired',
                'priority' => 'critical',
                'title' => 'SOAP vencido',
                'message' => "{$busesSoapVencido} bus(es) sin seguro obligatorio",
                'icon' => 'shield-off',
                'action_url' => '/buses?soap_vencido=true',
                'created_at' => now()->toISOString()
            ];
        }

        // 5. Combinar con notificaciones de RRHH
        $rrhhNotifications = $this->getRRHHNotifications($user);
        $notifications = array_merge($notifications, $rrhhNotifications);

        return $notifications;
    }

    /**
     * Notificaciones para Admin (todas las críticas)
     */
    private function getAdminNotifications($user)
    {
        return $this->getGerenteNotifications($user);
    }
}
