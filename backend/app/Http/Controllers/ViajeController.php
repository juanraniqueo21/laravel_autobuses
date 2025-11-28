<?php

namespace App\Http\Controllers;

use App\Models\Viaje;
use App\Models\AsignacionTurno;
use App\Models\Ruta;
use App\Models\RutaParada;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ViajeController extends Controller
{
    public function index(Request $request)
    {
        $query = Viaje::with([
            'asignacionTurno.bus',
            'asignacionTurno.conductores.empleado.user',
            'asignacionTurno.asistentes.empleado.user',
            'ruta.paradas'
        ]);

        if ($request->has('turno_id')) {
            $query->where('asignacion_turno_id', $request->turno_id);
        }
        if ($request->has('fecha')) {
            $query->porFecha($request->fecha);
        }
        if ($request->has('ruta_id')) {
            $query->where('ruta_id', $request->ruta_id);
        }
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        $viajes = $query->orderBy('fecha_hora_salida', 'desc')->get();
        return response()->json($viajes);
    }

    public function show($id)
    {
        $viaje = Viaje::with([
            'asignacionTurno.bus',
            'asignacionTurno.conductores.empleado.user',
            'asignacionTurno.asistentes.empleado.user',
            'ruta.paradas'
        ])->find($id);

        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }

        return response()->json($viaje);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'asignacion_turno_id' => 'required|exists:asignaciones_turno,id',
            'ruta_id' => 'required|exists:rutas,id',
            'fecha_hora_salida' => 'required',
            'fecha_hora_llegada' => 'nullable|after:fecha_hora_salida',
            'estado' => 'nullable|in:programado,en_curso,completado,cancelado',
            'observaciones' => 'nullable|string',
            'incidentes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $turno = AsignacionTurno::find($request->asignacion_turno_id);
        if (!$turno) {
            return response()->json(['error' => 'Turno no encontrado'], 404);
        }

        $fechaHoraSalida = $request->fecha_hora_salida;
        if (strlen($fechaHoraSalida) === 16) {
            $fechaHoraSalida .= ':00';
        }
        $fechaHoraSalida = str_replace('T', ' ', $fechaHoraSalida);

        Log::info('=== VIAJE: DEBUG ZONA HORARIA ===');
        Log::info('Frontend envió: ' . $request->fecha_hora_salida);
        Log::info('Procesado: ' . $fechaHoraSalida);

        $horaSalida = date('H:i:s', strtotime($fechaHoraSalida));
        if ($horaSalida < $turno->hora_inicio || $horaSalida > $turno->hora_termino) {
            return response()->json([
                'error' => "El viaje debe estar dentro del horario del turno ({$turno->hora_inicio} - {$turno->hora_termino})"
            ], 422);
        }

        $ruta = Ruta::find($request->ruta_id);
        if (!$ruta) {
            return response()->json(['error' => 'Ruta no encontrada'], 404);
        }

        $fecha = date('Y-m-d', strtotime($fechaHoraSalida));
        $codigoViaje = Viaje::generarCodigo($fecha);

        $fechaHoraLlegada = null;
        if ($request->fecha_hora_llegada) {
            $fechaHoraLlegada = $request->fecha_hora_llegada;
            if (strlen($fechaHoraLlegada) === 16) {
                $fechaHoraLlegada .= ':00';
            }
            $fechaHoraLlegada = str_replace('T', ' ', $fechaHoraLlegada);
        }

        try {
            DB::beginTransaction();

            $viajeId = DB::table('viajes')->insertGetId([
                'asignacion_turno_id' => $request->asignacion_turno_id,
                'codigo_viaje' => $codigoViaje,
                'nombre_viaje' => $ruta->nombre_ruta,
                'ruta_id' => $request->ruta_id,
                'fecha_hora_salida' => DB::raw("'{$fechaHoraSalida}'::timestamp"),
                'fecha_hora_llegada' => $fechaHoraLlegada ? DB::raw("'{$fechaHoraLlegada}'::timestamp") : null,
                'estado' => $request->estado ?? 'programado',
                'observaciones' => $request->observaciones,
                'incidentes' => $request->incidentes,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            Log::info('Viaje creado con ID: ' . $viajeId);

            $viaje = Viaje::with([
                'asignacionTurno.bus',
                'asignacionTurno.conductores.empleado.user',
                'asignacionTurno.asistentes.empleado.user',
                'ruta.paradas'
            ])->find($viajeId);

            Log::info('Fecha guardada: ' . $viaje->fecha_hora_salida);

            return response()->json($viaje, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear viaje: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al crear viaje: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $viaje = Viaje::find($id);
        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'fecha_hora_salida' => 'sometimes|required',
            'fecha_hora_llegada' => 'nullable|after:fecha_hora_salida',
            'estado' => 'nullable|in:programado,en_curso,completado,cancelado',
            'observaciones' => 'nullable|string',
            'incidentes' => 'nullable|string',
            'paradas' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Fechas (respetando zona horaria como en la versión de tu amigo)
            if ($request->has('fecha_hora_salida')) {
                $fechaHoraSalida = $request->fecha_hora_salida;
                if (strlen($fechaHoraSalida) === 16) {
                    $fechaHoraSalida .= ':00';
                }
                $fechaHoraSalida = str_replace('T', ' ', $fechaHoraSalida);

                DB::statement(
                    "UPDATE viajes SET fecha_hora_salida = ?::timestamp WHERE id = ?",
                    [$fechaHoraSalida, $id]
                );
            }

            if ($request->has('fecha_hora_llegada') && $request->fecha_hora_llegada) {
                $fechaHoraLlegada = $request->fecha_hora_llegada;
                if (strlen($fechaHoraLlegada) === 16) {
                    $fechaHoraLlegada .= ':00';
                }
                $fechaHoraLlegada = str_replace('T', ' ', $fechaHoraLlegada);

                DB::statement(
                    "UPDATE viajes SET fecha_hora_llegada = ?::timestamp WHERE id = ?",
                    [$fechaHoraLlegada, $id]
                );
            }

            // Datos base
            $viaje->update($request->only([
                'estado',
                'observaciones',
                'incidentes'
            ]));

            // Actualizar tarifas y horarios de paradas (lógica tuya original)
            if ($request->has('paradas') && is_array($request->paradas)) {
                foreach ($request->paradas as $paradaData) {
                    if (isset($paradaData['id'])) {
                        $parada = RutaParada::where('id', $paradaData['id'])
                            ->where('ruta_id', $viaje->ruta_id)
                            ->first();

                        if ($parada) {
                            $parada->update([
                                'tarifa_adulto'       => $paradaData['tarifa_adulto'] ?? $parada->tarifa_adulto,
                                'tarifa_estudiante'   => $paradaData['tarifa_estudiante'] ?? $parada->tarifa_estudiante,
                                'tarifa_tercera_edad' => $paradaData['tarifa_tercera_edad'] ?? $parada->tarifa_tercera_edad,
                                'hora_llegada'        => $paradaData['hora_llegada'] ?? $parada->hora_llegada,
                                'hora_salida'         => $paradaData['hora_salida'] ?? $parada->hora_salida,
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            $viaje = Viaje::with([
                'asignacionTurno.bus',
                'asignacionTurno.conductores.empleado.user',
                'asignacionTurno.asistentes.empleado.user',
                'ruta.paradas'
            ])->find($id);

            return response()->json($viaje);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al actualizar viaje: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al actualizar viaje: ' . $e->getMessage()
            ], 500);
        }
    }

    public function finalizar(Request $request, $id)
    {
        $viaje = Viaje::find($id);
        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }
        if ($viaje->estado === 'completado') {
            return response()->json(['error' => 'El viaje ya está completado'], 422);
        }

        $validator = Validator::make($request->all(), [
            'fecha_hora_llegada' => 'required',
            'observaciones' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $fechaHoraLlegada = $request->fecha_hora_llegada;
            if (strlen($fechaHoraLlegada) === 16) {
                $fechaHoraLlegada .= ':00';
            }
            $fechaHoraLlegada = str_replace('T', ' ', $fechaHoraLlegada);

            DB::statement(
                "UPDATE viajes SET 
                    fecha_hora_llegada = ?::timestamp, 
                    estado = 'completado',
                    observaciones = COALESCE(?, observaciones),
                    updated_at = NOW()
                WHERE id = ?",
                [$fechaHoraLlegada, $request->observaciones, $id]
            );

            DB::commit();

            $viaje = Viaje::with([
                'asignacionTurno.bus',
                'asignacionTurno.conductores.empleado.user',
                'asignacionTurno.asistentes.empleado.user',
                'ruta.paradas'
            ])->find($id);

            Log::info("Viaje {$id} finalizado correctamente");

            return response()->json($viaje);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al finalizar viaje: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al finalizar viaje: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cancelar(Request $request, $id)
    {
        $viaje = Viaje::find($id);
        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }
        if ($viaje->estado === 'completado') {
            return response()->json(['error' => 'No se puede cancelar un viaje completado'], 422);
        }

        $validator = Validator::make($request->all(), [
            'motivo' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $viaje->update([
                'estado' => 'cancelado',
                'incidentes' => ($viaje->incidentes ? $viaje->incidentes . "\n\n" : '') .
                    "CANCELADO: " . $request->motivo,
            ]);

            Log::info("Viaje {$id} cancelado: {$request->motivo}");

            return response()->json($viaje);

        } catch (\Exception $e) {
            Log::error('Error al cancelar viaje: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al cancelar viaje: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $viaje = Viaje::find($id);
        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }

        if ($viaje->estado === 'completado') {
            return response()->json([
                'error' => 'No se puede eliminar un viaje completado. Cancélelo en su lugar.'
            ], 422);
        }

        try {
            $viaje->delete();
            Log::info("Viaje {$id} eliminado correctamente");
            return response()->json(['message' => 'Viaje eliminado exitosamente']);

        } catch (\Exception $e) {
            Log::error('Error al eliminar viaje: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al eliminar viaje: ' . $e->getMessage()
            ], 500);
        }
    }

    public function porTurno($turnoId)
    {
        $viajes = Viaje::with(['ruta.paradas'])
            ->where('asignacion_turno_id', $turnoId)
            ->orderBy('fecha_hora_salida')
            ->get();

        return response()->json($viajes);
    }

    public function activos()
    {
        $viajes = Viaje::with([
            'asignacionTurno.bus',
            'asignacionTurno.conductores.empleado.user',
            'ruta.paradas'
        ])
            ->where('estado', 'en_curso')
            ->orderBy('fecha_hora_salida')
            ->get();

        return response()->json($viajes);
    }
}
