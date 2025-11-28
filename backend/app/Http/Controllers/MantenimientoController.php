<?php

namespace App\Http\Controllers;

use App\Models\Mantenimiento;
use App\Models\Bus;
use App\Models\AsignacionTurno;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class MantenimientoController extends Controller
{
    public function index()
    {
        $mantenimientos = Mantenimiento::with(['bus', 'mecanico.user'])->get();
        return response()->json($mantenimientos);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'bus_ids' => 'required|array|min:1',
            'bus_ids.*' => 'required|exists:buses,id',
            'mecanico_id' => 'required|exists:empleados,id',
            'tipo_mantenimiento' => 'required|in:preventivo,correctivo,revision',
            'descripcion' => 'required|string',
            'fecha_inicio' => 'required|date',
            'fecha_termino' => 'nullable|date|after_or_equal:fecha_inicio',
            'estado' => 'required|in:en_proceso,completado,cancelado',
            'costo_total' => 'nullable|numeric',
            'repuestos_utilizados' => 'nullable|string',
            'observaciones' => 'nullable|string',
        ], [
            'bus_ids.required' => 'Debe seleccionar al menos un bus',
            'bus_ids.min' => 'Debe seleccionar al menos un bus',
            'mecanico_id.required' => 'Debe seleccionar un mecánico',
            'fecha_inicio.required' => 'La fecha de inicio es obligatoria',
            'fecha_termino.after_or_equal' => 'La fecha de término debe ser posterior a la fecha de inicio',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $mantenimientosCreados = [];
            $errores = [];

            foreach ($request->bus_ids as $busId) {
                $bus = Bus::find($busId);
                
                if (!$bus) {
                    $errores[] = "Bus ID {$busId} no encontrado";
                    continue;
                }

                // Validar que el bus no tenga turnos en las fechas de mantenimiento
                $tieneTurnos = AsignacionTurno::where('bus_id', $busId)
                    ->where('fecha_turno', '>=', $request->fecha_inicio)
                    ->where('fecha_turno', '<=', $request->fecha_termino ?? $request->fecha_inicio)
                    ->where('estado', '!=', 'cancelado')
                    ->exists();

                if ($tieneTurnos) {
                    $errores[] = "El bus {$bus->patente} tiene turnos programados en las fechas seleccionadas";
                    continue;
                }

                // Crear el mantenimiento
                $mantenimiento = Mantenimiento::create([
                    'bus_id' => $busId,
                    'mecanico_id' => $request->mecanico_id,
                    'tipo_mantenimiento' => $request->tipo_mantenimiento,
                    'descripcion' => $request->descripcion,
                    'fecha_inicio' => $request->fecha_inicio,
                    'fecha_termino' => $request->fecha_termino,
                    'costo_total' => $request->costo_total,
                    'estado' => $request->estado,
                    'repuestos_utilizados' => $request->repuestos_utilizados ? json_encode(explode(',', $request->repuestos_utilizados)) : null,
                    'observaciones' => $request->observaciones,
                ]);

                // Cambiar estado del bus si el mantenimiento está en proceso
                if ($request->estado === 'en_proceso') {
                    $hoy = Carbon::now()->format('Y-m-d');
                    
                    // Si la fecha de inicio es hoy o antes, cambiar estado inmediatamente
                    if ($request->fecha_inicio <= $hoy) {
                        $bus->estado = 'mantenimiento';
                        $bus->save();
                    }
                }

                $mantenimientosCreados[] = $mantenimiento;
            }

            if (empty($mantenimientosCreados)) {
                DB::rollBack();
                return response()->json([
                    'message' => 'No se pudo crear ningún mantenimiento',
                    'errores' => $errores
                ], 422);
            }

            DB::commit();
            
            $mensaje = count($mantenimientosCreados) === 1 
                ? 'Mantenimiento creado exitosamente'
                : count($mantenimientosCreados) . ' mantenimientos creados exitosamente';

            return response()->json([
                'message' => $mensaje,
                'data' => $mantenimientosCreados,
                'errores' => $errores
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al guardar mantenimiento',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $mantenimiento = Mantenimiento::find($id);
        if (!$mantenimiento) {
            return response()->json(['message' => 'No encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'bus_id' => 'sometimes|required|exists:buses,id',
            'mecanico_id' => 'sometimes|required|exists:empleados,id',
            'tipo_mantenimiento' => 'sometimes|required|in:preventivo,correctivo,revision',
            'fecha_inicio' => 'sometimes|required|date',
            'fecha_termino' => 'nullable|date|after_or_equal:fecha_inicio',
            'estado' => 'sometimes|required|in:en_proceso,completado,cancelado',
            'costo_total' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $estadoAnterior = $mantenimiento->estado;
            $busAnterior = $mantenimiento->bus_id;
            
            // Preparar datos para actualizar
            $dataToUpdate = $request->only([
                'bus_id', 'mecanico_id', 'tipo_mantenimiento', 'descripcion',
                'fecha_inicio', 'fecha_termino', 'costo_total', 'estado', 'observaciones'
            ]);

            // Manejar repuestos
            if ($request->has('repuestos_utilizados')) {
                $dataToUpdate['repuestos_utilizados'] = $request->repuestos_utilizados 
                    ? json_encode(explode(',', $request->repuestos_utilizados)) 
                    : null;
            }

            // Actualizar el mantenimiento
            $mantenimiento->update($dataToUpdate);

            $bus = Bus::find($mantenimiento->bus_id);
            
            // Lógica de cambio de estado del bus
            if ($request->has('estado')) {
                $nuevoEstado = $request->estado;

                // Si pasa a completado o cancelado, el bus vuelve a estar operativo
                if (($nuevoEstado === 'completado' || $nuevoEstado === 'cancelado') && $estadoAnterior === 'en_proceso') {
                    $bus->estado = 'operativo';
                    $bus->save();
                }
                // Si se pone en proceso, bloquear el bus
                elseif ($nuevoEstado === 'en_proceso' && $estadoAnterior !== 'en_proceso') {
                    $hoy = Carbon::now()->format('Y-m-d');
                    
                    if ($mantenimiento->fecha_inicio <= $hoy) {
                        $bus->estado = 'mantenimiento';
                        $bus->save();
                    }
                }
            }

            // Si cambió de bus, liberar el anterior
            if ($request->has('bus_id') && $busAnterior != $request->bus_id) {
                $busAnteriorObj = Bus::find($busAnterior);
                if ($busAnteriorObj && $busAnteriorObj->estado === 'mantenimiento') {
                    // Solo liberar si no tiene otros mantenimientos activos
                    $otrosMantenimientos = Mantenimiento::where('bus_id', $busAnterior)
                        ->where('id', '!=', $id)
                        ->where('estado', 'en_proceso')
                        ->exists();
                    
                    if (!$otrosMantenimientos) {
                        $busAnteriorObj->estado = 'operativo';
                        $busAnteriorObj->save();
                    }
                }
            }

            DB::commit();
            return response()->json($mantenimiento->fresh(['bus', 'mecanico.user']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al actualizar',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $mantenimiento = Mantenimiento::find($id);
        if (!$mantenimiento) {
            return response()->json(['message' => 'No encontrado'], 404);
        }
        
        DB::beginTransaction();
        try {
            // Si borramos un mantenimiento en curso, verificar si liberar el bus
            if ($mantenimiento->estado === 'en_proceso') {
                $bus = Bus::find($mantenimiento->bus_id);
                if ($bus) {
                    // Solo liberar si no tiene otros mantenimientos activos
                    $otrosMantenimientos = Mantenimiento::where('bus_id', $bus->id)
                        ->where('id', '!=', $id)
                        ->where('estado', 'en_proceso')
                        ->exists();
                    
                    if (!$otrosMantenimientos) {
                        $bus->estado = 'operativo';
                        $bus->save();
                    }
                }
            }
            
            $mantenimiento->delete();
            DB::commit();
            
            return response()->json(['message' => 'Eliminado correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al eliminar',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener buses disponibles para mantenimiento en un rango de fechas
     */
    public function busesDisponibles(Request $request)
    {
        $fechaInicio = $request->query('fecha_inicio');
        $fechaTermino = $request->query('fecha_termino', $fechaInicio);

        $buses = Bus::all();
        $busesDisponibles = [];

        foreach ($buses as $bus) {
            // Verificar si tiene turnos en esas fechas
            $tieneTurnos = AsignacionTurno::where('bus_id', $bus->id)
                ->where('fecha_turno', '>=', $fechaInicio)
                ->where('fecha_turno', '<=', $fechaTermino)
                ->where('estado', '!=', 'cancelado')
                ->exists();

            $busesDisponibles[] = [
                'bus' => $bus,
                'disponible' => !$tieneTurnos,
                'tieneTurnos' => $tieneTurnos
            ];
        }

        return response()->json($busesDisponibles);
    }

    /**
     * Obtener mecánicos disponibles para un rango de fechas
     */
    public function mecanicosDisponibles(Request $request)
    {
        $fechaInicio = $request->query('fecha_inicio');
        $fechaTermino = $request->query('fecha_termino', $fechaInicio);

        // Obtener IDs de mecánicos que ya tienen mantenimientos en esas fechas
        $mecanicosOcupados = Mantenimiento::where('estado', 'en_proceso')
            ->where(function($query) use ($fechaInicio, $fechaTermino) {
                $query->whereBetween('fecha_inicio', [$fechaInicio, $fechaTermino])
                      ->orWhereBetween('fecha_termino', [$fechaInicio, $fechaTermino])
                      ->orWhere(function($q) use ($fechaInicio, $fechaTermino) {
                          $q->where('fecha_inicio', '<=', $fechaInicio)
                            ->where('fecha_termino', '>=', $fechaTermino);
                      });
            })
            ->pluck('mecanico_id')
            ->toArray();

        return response()->json($mecanicosOcupados);
    }
}