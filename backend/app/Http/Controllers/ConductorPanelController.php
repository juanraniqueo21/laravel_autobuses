<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Empleado;
use App\Models\Conductor;
use App\Models\AsignacionTurno;
use App\Models\Viaje;
use App\Models\TurnoConductor;
use Carbon\Carbon;

class ConductorPanelController extends Controller
{
    /**
     * Obtener el conductor asociado al usuario autenticado
     */
    private function getConductorActual()
    {
        $user = Auth::user();
        
        if (!$user) {
            return null;
        }

        // Buscar empleado del usuario
        $empleado = Empleado::where('user_id', $user->id)->first();
        
        if (!$empleado) {
            return null;
        }

        // Buscar conductor del empleado
        return Conductor::where('empleado_id', $empleado->id)->first();
    }

    /**
     * Dashboard del conductor - Métricas personales
     * GET /api/conductor/dashboard
     */
    public function dashboard()
    {
        try {
            $conductor = $this->getConductorActual();

            if (!$conductor) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró el perfil de conductor asociado a este usuario'
                ], 404);
            }

            $hoy = Carbon::today();
            $inicioMes = Carbon::now()->startOfMonth();
            $finMes = Carbon::now()->endOfMonth();

            // Obtener IDs de turnos donde este conductor está asignado
            $turnoIds = TurnoConductor::where('conductor_id', $conductor->id)
                ->pluck('asignacion_turno_id');

            // Turnos de hoy
            $turnosHoy = AsignacionTurno::whereIn('id', $turnoIds)
                ->whereDate('fecha_turno', $hoy)
                ->count();

            // Turnos de la semana
            $turnosSemana = AsignacionTurno::whereIn('id', $turnoIds)
                ->whereBetween('fecha_turno', [
                    Carbon::now()->startOfWeek(),
                    Carbon::now()->endOfWeek()
                ])
                ->count();

            // Turnos del mes
            $turnosMes = AsignacionTurno::whereIn('id', $turnoIds)
                ->whereBetween('fecha_turno', [$inicioMes, $finMes])
                ->count();

            // Viajes completados este mes
            $viajesCompletados = Viaje::whereIn('asignacion_turno_id', $turnoIds)
                ->where('estado', 'completado')
                ->whereHas('asignacionTurno', function($q) use ($inicioMes, $finMes) {
                    $q->whereBetween('fecha_turno', [$inicioMes, $finMes]);
                })
                ->count();

            // Viajes en curso
            $viajesEnCurso = Viaje::whereIn('asignacion_turno_id', $turnoIds)
                ->where('estado', 'en_curso')
                ->count();

            // Próximo turno
            $proximoTurno = AsignacionTurno::with(['bus', 'conductores.empleado.user'])
                ->whereIn('id', $turnoIds)
                ->where(function($q) use ($hoy) {
                    $q->whereDate('fecha_turno', '>', $hoy)
                      ->orWhere(function($q2) use ($hoy) {
                          $q2->whereDate('fecha_turno', $hoy)
                             ->where('hora_inicio', '>', Carbon::now()->format('H:i:s'));
                      });
                })
                ->orderBy('fecha_turno')
                ->orderBy('hora_inicio')
                ->first();

            // Información del conductor (Cargamos relaciones)
            $conductor->load('empleado.user');

            return response()->json([
                'success' => true,
                'data' => [
                    'conductor' => [
                        'id' => $conductor->id,
                        'nombre' => $conductor->empleado->user->nombre . ' ' . $conductor->empleado->user->apellido,
                        'numero_funcional' => $conductor->empleado->numero_funcional,
                        'clase_licencia' => $conductor->clase_licencia,
                        'vencimiento_licencia' => $conductor->fecha_vencimiento_licencia,
                        'apto_conducir' => $conductor->apto_conducir,
                        'estado' => $conductor->estado,
                        
                        // --- CORRECCIÓN DE CAMPOS ---
                        'email' => $conductor->empleado->user->email, 
                        
                        // Aquí estaba el error: usamos 'telefono_personal' en lugar de 'telefono'
                        'telefono' => $conductor->empleado->telefono_personal ?? 'No registrado',
                        
                        'direccion' => $conductor->empleado->direccion ?? 'No registrada',
                        
                        'user' => $conductor->empleado->user,
                        'empleado' => $conductor->empleado,
                        // ---------------------------
                    ],
                    'metricas' => [
                        'turnos_hoy' => $turnosHoy,
                        'turnos_semana' => $turnosSemana,
                        'turnos_mes' => $turnosMes,
                        'viajes_completados_mes' => $viajesCompletados,
                        'viajes_en_curso' => $viajesEnCurso,
                    ],
                    'proximo_turno' => $proximoTurno ? [
                        'id' => $proximoTurno->id,
                        'fecha' => $proximoTurno->fecha_turno,
                        'hora_inicio' => $proximoTurno->hora_inicio,
                        'hora_termino' => $proximoTurno->hora_termino,
                        'tipo_turno' => $proximoTurno->tipo_turno,
                        'bus' => $proximoTurno->bus ? [
                            'patente' => $proximoTurno->bus->patente,
                            'marca' => $proximoTurno->bus->marca,
                            'modelo' => $proximoTurno->bus->modelo,
                        ] : null,
                    ] : null,
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

    // ... (Resto de métodos misTurnos, misViajes, verTurno, verViaje se mantienen igual)
    /**
     * Obtener turnos del conductor autenticado
     * GET /api/conductor/mis-turnos
     */
    public function misTurnos(Request $request)
    {
        try {
            $conductor = $this->getConductorActual();

            if (!$conductor) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró el perfil de conductor'
                ], 404);
            }

            // Obtener IDs de turnos asignados a este conductor
            $turnoIds = TurnoConductor::where('conductor_id', $conductor->id)
                ->pluck('asignacion_turno_id');

            $query = AsignacionTurno::with([
                'bus',
                'conductores.empleado.user',
                'asistentes.empleado.user',
                'viajes.ruta'
            ])->whereIn('id', $turnoIds);

            // Filtros opcionales
            if ($request->has('fecha')) {
                $query->whereDate('fecha_turno', $request->fecha);
            }

            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha_turno', [$request->fecha_inicio, $request->fecha_fin]);
            }

            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            // Por defecto, mostrar turnos desde hoy en adelante
            if (!$request->has('fecha') && !$request->has('fecha_inicio') && !$request->has('mostrar_todos')) {
                $query->whereDate('fecha_turno', '>=', Carbon::today());
            }

            $turnos = $query->orderBy('fecha_turno', 'asc')
                            ->orderBy('hora_inicio', 'asc')
                            ->get();

            // Agregar el rol del conductor en cada turno
            $turnos = $turnos->map(function($turno) use ($conductor) {
                $miAsignacion = TurnoConductor::where('asignacion_turno_id', $turno->id)
                    ->where('conductor_id', $conductor->id)
                    ->first();
                
                $turno->mi_rol = $miAsignacion ? $miAsignacion->rol : null;
                return $turno;
            });

            return response()->json([
                'success' => true,
                'data' => $turnos,
                'total' => $turnos->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar turnos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener viajes del conductor autenticado
     * GET /api/conductor/mis-viajes
     */
    public function misViajes(Request $request)
    {
        try {
            $conductor = $this->getConductorActual();

            if (!$conductor) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró el perfil de conductor'
                ], 404);
            }

            // Obtener IDs de turnos asignados a este conductor
            $turnoIds = TurnoConductor::where('conductor_id', $conductor->id)
                ->pluck('asignacion_turno_id');

            $query = Viaje::with([
                'asignacionTurno.bus',
                'asignacionTurno.conductores.empleado.user',
                'asignacionTurno.asistentes.empleado.user',
                'ruta.paradas'
            ])->whereIn('asignacion_turno_id', $turnoIds);

            // Filtros opcionales
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            if ($request->has('fecha')) {
                $query->whereDate('fecha_hora_salida', $request->fecha);
            }

            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha_hora_salida', [
                    $request->fecha_inicio . ' 00:00:00',
                    $request->fecha_fin . ' 23:59:59'
                ]);
            }

            $viajes = $query->orderBy('fecha_hora_salida', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $viajes,
                'total' => $viajes->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar viajes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ver detalle de un turno específico (solo si está asignado al conductor)
     * GET /api/conductor/mis-turnos/{id}
     */
    public function verTurno($id)
    {
        try {
            $conductor = $this->getConductorActual();

            if (!$conductor) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró el perfil de conductor'
                ], 404);
            }

            // Verificar que el turno pertenece a este conductor
            $asignacion = TurnoConductor::where('conductor_id', $conductor->id)
                ->where('asignacion_turno_id', $id)
                ->first();

            if (!$asignacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este turno'
                ], 403);
            }

            $turno = AsignacionTurno::with([
                'bus',
                'conductores.empleado.user',
                'asistentes.empleado.user',
                'viajes.ruta.paradas'
            ])->find($id);

            return response()->json([
                'success' => true,
                'data' => $turno,
                'mi_rol' => $asignacion->rol
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar turno',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ver detalle de un viaje específico (solo si está en un turno asignado)
     * GET /api/conductor/mis-viajes/{id}
     */
    public function verViaje($id)
    {
        try {
            $conductor = $this->getConductorActual();

            if (!$conductor) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró el perfil de conductor'
                ], 404);
            }

            $viaje = Viaje::with([
                'asignacionTurno.bus',
                'asignacionTurno.conductores.empleado.user',
                'asignacionTurno.asistentes.empleado.user',
                'ruta.paradas'
            ])->find($id);

            if (!$viaje) {
                return response()->json([
                    'success' => false,
                    'message' => 'Viaje no encontrado'
                ], 404);
            }

            // Verificar que el viaje pertenece a un turno de este conductor
            $asignacion = TurnoConductor::where('conductor_id', $conductor->id)
                ->where('asignacion_turno_id', $viaje->asignacion_turno_id)
                ->first();

            if (!$asignacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este viaje'
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $viaje
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar viaje',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}