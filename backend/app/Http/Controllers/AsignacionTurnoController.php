<?php

namespace App\Http\Controllers;

use App\Models\AsignacionTurno;
use App\Models\TurnoConductor;
use App\Models\TurnoAsistente;
use App\Models\Bus;
use App\Models\Conductor;
use App\Models\Asistente;
use App\Models\Empleado;
use App\Models\PermisoLicencia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AsignacionTurnoController extends Controller
{
    /**
     * Listar todos los turnos
     * GET /api/turnos
     */
    public function index(Request $request)
    {
        try {
            $query = AsignacionTurno::with([
                'bus',
                'conductores.empleado.user',
                'asistentes.empleado.user',
            ]);

            // Filtros opcionales
            if ($request->has('fecha')) {
                $query->whereDate('fecha_turno', $request->fecha);
            }

            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->entreFechas($request->fecha_inicio, $request->fecha_fin);
            }

            if ($request->has('tipo_turno')) {
                $query->porTipo($request->tipo_turno);
            }

            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            if ($request->has('conductor_id')) {
                $query->porConductor($request->conductor_id);
            }

            if ($request->has('bus_id')) {
                $query->porBus($request->bus_id);
            }

            // Ordenar por fecha y hora
            $query->orderBy('fecha_turno', 'desc')
                  ->orderBy('hora_inicio', 'desc');

            $perPage = $request->get('per_page', 50);
            $turnos = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $turnos->items(),
                'total' => $turnos->total(),
                'per_page' => $turnos->perPage(),
                'current_page' => $turnos->currentPage(),
                'last_page' => $turnos->lastPage()
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
     * Mostrar un turno específico
     * GET /api/turnos/{id}
     */
    public function show($id)
    {
        try {
            $turno = AsignacionTurno::with([
                'bus',
                'conductores.empleado.user',
                'asistentes.empleado.user',
                'viajes.ruta',
            ])->find($id);

            if (!$turno) {
                return response()->json([
                    'success' => false,
                    'message' => 'Turno no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $turno
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener turno',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo turno
     * POST /api/turnos
     */
    public function store(Request $request)
    {
        try {
            // Debug: ver que datos llegan
            \Log::info('=== DATOS RECIBIDOS EN TURNO ===');
            \Log::info('Request all: ' . json_encode($request->all()));
            \Log::info('Request input: ' . json_encode($request->input()));
            \Log::info('Request getContent: ' . $request->getContent());
            \Log::info('Content-Type: ' . $request->header('Content-Type'));
            \Log::info('================================');
            
            // Validaciones básicas
            $validator = Validator::make($request->all(), [
                'bus_id' => 'required|exists:buses,id',
                'fecha_turno' => 'required|date|after_or_equal:today',
                'hora_inicio' => 'required|date_format:H:i',
                'hora_termino' => 'required|date_format:H:i',
                'tipo_turno' => 'required|in:mañana,tarde,noche,completo',
                'estado' => 'nullable|in:programado,en_curso,completado,cancelado',
                'observaciones' => 'nullable|string|max:1000',
                
                // Conductores (array)
                'conductores' => 'required|array|min:1',
                'conductores.*.conductor_id' => 'required|exists:conductores,id',
                'conductores.*.rol' => 'required|in:principal,apoyo',
                
                // Asistentes (array, opcional)
                'asistentes' => 'nullable|array',
                'asistentes.*.asistente_id' => 'required|exists:asistentes,id',
                'asistentes.*.posicion' => 'required|in:piso_superior,piso_inferior,general',
            ], [
                'bus_id.required' => 'El bus es obligatorio',
                'bus_id.exists' => 'El bus seleccionado no existe',
                'fecha_turno.required' => 'La fecha del turno es obligatoria',
                'fecha_turno.after_or_equal' => 'La fecha debe ser hoy o posterior',
                'hora_inicio.required' => 'La hora de inicio es obligatoria',
                'hora_termino.required' => 'La hora de término es obligatoria',
                'tipo_turno.required' => 'El tipo de turno es obligatorio',
                'conductores.required' => 'Debe asignar al menos un conductor',
                'conductores.min' => 'Debe asignar al menos un conductor',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // ============================================
            // VALIDACIONES AVANZADAS
            // ============================================

            // 1. Validar que el bus existe y está operativo
            $bus = Bus::find($request->bus_id);
            if (!$bus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bus no encontrado'
                ], 404);
            }

            if ($bus->estado !== 'operativo') {
                return response()->json([
                    'success' => false,
                    'message' => 'El bus no está operativo',
                    'errors' => ['bus_id' => ['El bus debe estar en estado operativo']]
                ], 422);
            }

            // 2. Validar documentación del bus
            if ($bus->vencimiento_soap && Carbon::parse($bus->vencimiento_soap)->lt(Carbon::parse($request->fecha_turno))) {
                return response()->json([
                    'success' => false,
                    'message' => 'El SOAP del bus estará vencido en la fecha del turno',
                    'errors' => ['bus_id' => ['El SOAP del bus vence antes de la fecha del turno']]
                ], 422);
            }

            if ($bus->proxima_revision_tecnica && Carbon::parse($bus->proxima_revision_tecnica)->lt(Carbon::parse($request->fecha_turno))) {
                return response()->json([
                    'success' => false,
                    'message' => 'La Revisión Técnica del bus estará vencida en la fecha del turno',
                    'errors' => ['bus_id' => ['La Revisión Técnica del bus vence antes de la fecha del turno']]
                ], 422);
            }

            // 3. Validar que no hay solapamiento de horarios para el mismo bus
            if (AsignacionTurno::tieneSolapamiento(
                $request->bus_id,
                $request->fecha_turno,
                $request->hora_inicio,
                $request->hora_termino
            )) {
                return response()->json([
                    'success' => false,
                    'message' => 'El bus ya tiene un turno asignado en ese horario',
                    'errors' => ['bus_id' => ['Ya existe un turno para este bus en el horario seleccionado']]
                ], 422);
            }

            // ============================================
            // 4. VALIDAR CONDUCTORES (INCLUYE LICENCIAS)
            // ============================================
            $erroresConductores = [];
            foreach ($request->conductores as $index => $conductorData) {
                $conductor = Conductor::with('empleado.user')->find($conductorData['conductor_id']);
                
                if (!$conductor) {
                    $erroresConductores["conductores.{$index}.conductor_id"][] = "Conductor no encontrado";
                    continue;
                }

                // *** VALIDACIÓN DE LICENCIA MÉDICA ***
                if ($conductor->empleado) {
                    $empleado = $conductor->empleado;
                    
                    // Verificar si tiene licencia activa para la fecha del turno
                    $licenciaActiva = PermisoLicencia::where('empleado_id', $empleado->id)
                        ->where('estado', 'aprobado')
                        ->where('fecha_inicio', '<=', $request->fecha_turno)
                        ->where('fecha_termino', '>=', $request->fecha_turno)
                        ->first();
                    
                    if ($licenciaActiva) {
                        $nombreEmpleado = $empleado->user ? "{$empleado->user->nombre} {$empleado->user->apellido}" : "El conductor";
                        $erroresConductores["conductores.{$index}.conductor_id"][] = 
                            "{$nombreEmpleado} tiene licencia médica del {$licenciaActiva->fecha_inicio} al {$licenciaActiva->fecha_termino}";
                        continue;
                    }
                }

                // Validar estado del conductor
                if ($conductor->estado !== 'activo') {
                    $erroresConductores["conductores.{$index}.conductor_id"][] = "El conductor no está activo";
                }

                // Validar que esté apto para conducir
                if (!$conductor->apto_conducir) {
                    $erroresConductores["conductores.{$index}.conductor_id"][] = "El conductor no está apto para conducir";
                }

                // Validar licencia vigente
                if ($conductor->fecha_vencimiento_licencia && Carbon::parse($conductor->fecha_vencimiento_licencia)->lt(Carbon::parse($request->fecha_turno))) {
                    $erroresConductores["conductores.{$index}.conductor_id"][] = "La licencia del conductor estará vencida en la fecha del turno";
                }

                // Validar que no tenga otro turno el mismo día
                if (AsignacionTurno::conductorTieneTurnoEnFecha($conductorData['conductor_id'], $request->fecha_turno)) {
                    $erroresConductores["conductores.{$index}.conductor_id"][] = "El conductor ya tiene un turno asignado ese día";
                }
            }

            if (!empty($erroresConductores)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores en la validación de conductores',
                    'errors' => $erroresConductores
                ], 422);
            }

            // ============================================
            // 5. VALIDAR ASISTENTES (INCLUYE LICENCIAS)
            // ============================================
            if ($bus->tipo_bus === 'doble_piso') {
                if (empty($request->asistentes) || count($request->asistentes) === 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Los buses de doble piso requieren al menos un asistente',
                        'errors' => ['asistentes' => ['Debe asignar al menos un asistente para buses de doble piso']]
                    ], 422);
                }

                $erroresAsistentes = [];
                foreach ($request->asistentes as $index => $asistenteData) {
                    $asistente = Asistente::with('empleado.user')->find($asistenteData['asistente_id']);
                    
                    if (!$asistente) {
                        $erroresAsistentes["asistentes.{$index}.asistente_id"][] = "Asistente no encontrado";
                        continue;
                    }

                    // *** VALIDACIÓN DE LICENCIA MÉDICA ***
                    if ($asistente->empleado) {
                        $empleado = $asistente->empleado;
                        
                        // Verificar si tiene licencia activa para la fecha del turno
                        $licenciaActiva = PermisoLicencia::where('empleado_id', $empleado->id)
                            ->where('estado', 'aprobado')
                            ->where('fecha_inicio', '<=', $request->fecha_turno)
                            ->where('fecha_termino', '>=', $request->fecha_turno)
                            ->first();
                        
                        if ($licenciaActiva) {
                            $nombreEmpleado = $empleado->user ? "{$empleado->user->nombre} {$empleado->user->apellido}" : "El asistente";
                            $erroresAsistentes["asistentes.{$index}.asistente_id"][] = 
                                "{$nombreEmpleado} tiene licencia médica del {$licenciaActiva->fecha_inicio} al {$licenciaActiva->fecha_termino}";
                            continue;
                        }
                    }

                    // Validar estado del asistente
                    if ($asistente->estado !== 'activo') {
                        $erroresAsistentes["asistentes.{$index}.asistente_id"][] = "El asistente no está activo";
                    }

                    // Validar que no tenga otro turno el mismo día
                    if (AsignacionTurno::asistenteTieneTurnoEnFecha($asistenteData['asistente_id'], $request->fecha_turno)) {
                        $erroresAsistentes["asistentes.{$index}.asistente_id"][] = "El asistente ya tiene un turno asignado ese día";
                    }
                }

                if (!empty($erroresAsistentes)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Errores en la validación de asistentes',
                        'errors' => $erroresAsistentes
                    ], 422);
                }
            }

            // ============================================
            // CREAR TURNO (Transacción)
            // ============================================

            DB::beginTransaction();

            try {
                // Crear el turno
                $turno = AsignacionTurno::create([
                    'bus_id' => $request->bus_id,
                    'fecha_turno' => $request->fecha_turno,
                    'hora_inicio' => $request->hora_inicio,
                    'hora_termino' => $request->hora_termino,
                    'tipo_turno' => $request->tipo_turno,
                    'estado' => $request->estado ?? 'programado',
                    'observaciones' => $request->observaciones,
                ]);

                // Asignar conductores
                foreach ($request->conductores as $conductorData) {
                    $turno->conductores()->attach($conductorData['conductor_id'], [
                    'rol' => $conductorData['rol']
                    ]);
                }

                // Asignar asistentes (si hay)
                if (!empty($request->asistentes)) {
                    foreach ($request->asistentes as $asistenteData) {
                        TurnoAsistente::create([
                            'asignacion_turno_id' => $turno->id,
                            'asistente_id' => $asistenteData['asistente_id'],
                            'posicion' => $asistenteData['posicion'],
                        ]);
                    }
                }

                DB::commit();

                // Recargar con relaciones
                $turno->load([
                    'bus',
                    'conductores.empleado.user',
                    'asistentes.empleado.user',
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Turno creado exitosamente',
                    'data' => $turno
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear turno',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un turno
     * PUT /api/turnos/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $turno = AsignacionTurno::find($id);

            if (!$turno) {
                return response()->json([
                    'success' => false,
                    'message' => 'Turno no encontrado'
                ], 404);
            }

            // Solo permitir actualizar si está programado
            if ($turno->estado === 'completado') {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede modificar un turno completado'
                ], 422);
            }

            // Validaciones (similar a store, pero con turnoId para excluir el actual)
            // ... (código similar al store, adaptado para update)

            $turno->update($request->only([
                'bus_id', 'fecha_turno', 'hora_inicio', 'hora_termino',
                'tipo_turno', 'estado', 'observaciones'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Turno actualizado exitosamente',
                'data' => $turno->fresh(['bus', 'conductores', 'asistentes'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar turno',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un turno
     * DELETE /api/turnos/{id}
     */
    public function destroy($id)
    {
        try {
            $turno = AsignacionTurno::find($id);

            if (!$turno) {
                return response()->json([
                    'success' => false,
                    'message' => 'Turno no encontrado'
                ], 404);
            }

            // Solo permitir eliminar si está programado
            if ($turno->estado !== 'programado') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden eliminar turnos programados'
                ], 422);
            }

            $turno->delete();

            return response()->json([
                'success' => true,
                'message' => 'Turno eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar turno',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener turnos de un mes específico (para calendario)
     * GET /api/turnos/calendario/{año}/{mes}
     */
    public function calendario($anio, $mes)
    {
        try {
            $fechaInicio = Carbon::create($anio, $mes, 1)->startOfMonth();
            $fechaFin = Carbon::create($anio, $mes, 1)->endOfMonth();

            $turnos = AsignacionTurno::with([
                'bus',
                'conductores.empleado.user',
                'asistentes.empleado.user',
            ])
            ->entreFechas($fechaInicio, $fechaFin)
            ->orderBy('fecha_turno')
            ->orderBy('hora_inicio')
            ->get();

            return response()->json([
                'success' => true,
                'data' => $turnos,
                'periodo' => [
                    'inicio' => $fechaInicio->format('Y-m-d'),
                    'fin' => $fechaFin->format('Y-m-d'),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener calendario',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}