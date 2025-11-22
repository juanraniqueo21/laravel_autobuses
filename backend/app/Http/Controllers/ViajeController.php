<?php

namespace App\Http\Controllers;

use App\Models\Viaje;
use App\Models\AsignacionTurno;
use App\Models\Ruta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ViajeController extends Controller
{
    // ============================================
    // LISTAR VIAJES
    // ============================================

    /**
     * Listar todos los viajes con información completa
     */
    public function index(Request $request)
    {
        $query = Viaje::with([
            'asignacionTurno.bus',
            'asignacionTurno.conductores.empleado',
            'asignacionTurno.asistentes.empleado',
            'ruta.paradas'
        ]);

        // Filtros opcionales
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

    /**
     * Obtener un viaje específico
     */
    public function show($id)
    {
        $viaje = Viaje::with([
            'asignacionTurno.bus',
            'asignacionTurno.conductores.empleado',
            'asignacionTurno.asistentes.empleado',
            'ruta.paradas'
        ])->find($id);

        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }

        return response()->json($viaje);
    }

    // ============================================
    // CREAR VIAJE
    // ============================================

    /**
     * Crear un nuevo viaje
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'asignacion_turno_id' => 'required|exists:asignaciones_turno,id',
            'ruta_id' => 'required|exists:rutas,id',
            'fecha_hora_salida' => 'required|date',
            'fecha_hora_llegada' => 'nullable|date|after:fecha_hora_salida',
            'estado' => 'nullable|in:programado,en_curso,completado,cancelado',
            'observaciones' => 'nullable|string',
            'incidentes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verificar que el turno existe y está activo
        $turno = AsignacionTurno::find($request->asignacion_turno_id);
        if (!$turno) {
            return response()->json(['error' => 'Turno no encontrado'], 404);
        }

        // Verificar que el viaje está dentro del horario del turno
        $horaSalida = date('H:i:s', strtotime($request->fecha_hora_salida));
        if ($horaSalida < $turno->hora_inicio || $horaSalida > $turno->hora_termino) {
            return response()->json([
                'error' => "El viaje debe estar dentro del horario del turno ({$turno->hora_inicio} - {$turno->hora_termino})"
            ], 422);
        }

        // Obtener información de la ruta
        $ruta = Ruta::find($request->ruta_id);
        if (!$ruta) {
            return response()->json(['error' => 'Ruta no encontrada'], 404);
        }

        // Generar código de viaje automático
        $fecha = date('Y-m-d', strtotime($request->fecha_hora_salida));
        $codigoViaje = Viaje::generarCodigo($fecha);

        // Crear el viaje
        $viaje = Viaje::create([
            'asignacion_turno_id' => $request->asignacion_turno_id,
            'codigo_viaje' => $codigoViaje,
            'nombre_viaje' => $ruta->nombre_ruta,
            'ruta_id' => $request->ruta_id,
            'fecha_hora_salida' => $request->fecha_hora_salida,
            'fecha_hora_llegada' => $request->fecha_hora_llegada,
            'estado' => $request->estado ?? 'programado',
            'observaciones' => $request->observaciones,
            'incidentes' => $request->incidentes,
        ]);

        // Cargar relaciones
        $viaje->load([
            'asignacionTurno.bus',
            'asignacionTurno.conductores.empleado',
            'asignacionTurno.asistentes.empleado',
            'ruta.paradas'
        ]);

        return response()->json($viaje, 201);
    }

    // ============================================
    // ACTUALIZAR VIAJE
    // ============================================

    /**
     * Actualizar un viaje existente
     */
    public function update(Request $request, $id)
    {
        $viaje = Viaje::find($id);

        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'fecha_hora_salida' => 'sometimes|required|date',
            'fecha_hora_llegada' => 'nullable|date|after:fecha_hora_salida',
            'estado' => 'nullable|in:programado,en_curso,completado,cancelado',
            'observaciones' => 'nullable|string',
            'incidentes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // No permitir cambiar turno o ruta una vez creado
        $viaje->update($request->only([
            'fecha_hora_salida',
            'fecha_hora_llegada',
            'estado',
            'observaciones',
            'incidentes'
        ]));

        // Cargar relaciones
        $viaje->load([
            'asignacionTurno.bus',
            'asignacionTurno.conductores.empleado',
            'asignacionTurno.asistentes.empleado',
            'ruta.paradas'
        ]);

        return response()->json($viaje);
    }

    // ============================================
    // FINALIZAR VIAJE
    // ============================================

    /**
     * Finalizar un viaje (registrar hora de llegada)
     */
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
            'fecha_hora_llegada' => 'required|date|after:' . $viaje->fecha_hora_salida,
            'observaciones' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $viaje->update([
            'fecha_hora_llegada' => $request->fecha_hora_llegada,
            'estado' => 'completado',
            'observaciones' => $request->observaciones ?? $viaje->observaciones,
        ]);

        $viaje->load([
            'asignacionTurno.bus',
            'asignacionTurno.conductores.empleado',
            'asignacionTurno.asistentes.empleado',
            'ruta'
        ]);

        return response()->json($viaje);
    }

    // ============================================
    // CANCELAR VIAJE
    // ============================================

    /**
     * Cancelar un viaje
     */
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

        $viaje->update([
            'estado' => 'cancelado',
            'incidentes' => ($viaje->incidentes ? $viaje->incidentes . "\n\n" : '') . 
                           "CANCELADO: " . $request->motivo,
        ]);

        return response()->json($viaje);
    }

    // ============================================
    // ELIMINAR VIAJE
    // ============================================

    /**
     * Eliminar un viaje
     */
    public function destroy($id)
    {
        $viaje = Viaje::find($id);

        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }

        // Solo permitir eliminar viajes que no estén completados
        if ($viaje->estado === 'completado') {
            return response()->json([
                'error' => 'No se puede eliminar un viaje completado. Cancélelo en su lugar.'
            ], 422);
        }

        $viaje->delete();

        return response()->json(['message' => 'Viaje eliminado exitosamente']);
    }

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================

    /**
     * Obtener viajes de un turno específico
     */
    public function porTurno($turnoId)
    {
        $viajes = Viaje::with([
            'ruta.paradas'
        ])
        ->where('asignacion_turno_id', $turnoId)
        ->orderBy('fecha_hora_salida')
        ->get();

        return response()->json($viajes);
    }

    /**
     * Obtener viajes activos (en curso)
     */
    public function activos()
    {
        $viajes = Viaje::with([
            'asignacionTurno.bus',
            'asignacionTurno.conductores.empleado',
            'ruta'
        ])
        ->where('estado', 'en_curso')
        ->orderBy('fecha_hora_salida')
        ->get();

        return response()->json($viajes);
    }
}