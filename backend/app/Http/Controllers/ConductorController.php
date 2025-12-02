<?php

namespace App\Http\Controllers;

use App\Models\Conductor;
use App\Models\Empleado;
use Illuminate\Http\Request;

class ConductorController extends Controller
{
    // ============================================
    // GET - Obtener todos los conductores
    // ============================================
    public function index()
    {
        $conductores = Conductor::with('empleado.user')->get();
        return response()->json($conductores);
    }

    // ============================================
    // GET - Obtener un conductor específico
    // ============================================
    public function show($id)
    {
        $conductor = Conductor::with('empleado.user')->find($id);
        
        if (!$conductor) {
            return response()->json(['error' => 'Conductor no encontrado'], 404);
        }
        
        return response()->json($conductor);
    }

    // ============================================
    // POST - Crear nuevo conductor
    // ============================================
    public function store(Request $request)
    {
        // Validar datos de entrada
        $validated = $request->validate([
            'empleado_id' => 'required|exists:empleados,id',
            'numero_licencia' => 'required|string|unique:conductores',
            'clase_licencia' => 'required|in:A,A2,A3,B,C,D,E',
            'fecha_primera_licencia' => 'required|date',
            'fecha_vencimiento_licencia' => 'required|date|after:fecha_primera_licencia',
            'estado_licencia' => 'required|in:vigente,vencida,suspendida',
            'anios_experiencia' => 'nullable|integer|min:0',
            'estado' => 'nullable|in:activo,licencia_medica,suspendido,inactivo',
            'observaciones_licencia' => 'nullable|string|max:500',
            'cantidad_infracciones' => 'nullable|integer|min:0',
            'cantidad_accidentes' => 'nullable|integer|min:0',
            'historial_sanciones' => 'nullable|string|max:1000',
            'fecha_ultima_revision_medica' => 'nullable|date',
            'apto_conducir' => 'nullable|boolean',
            'certificado_rcp' => 'nullable|boolean',
            'vencimiento_rcp' => 'nullable|date',
            'certificado_defensa' => 'nullable|boolean',
            'vencimiento_defensa' => 'nullable|date',
            'fecha_examen_ocupacional' => 'nullable|date',
            'vencimiento_examen_ocupacional' => 'nullable|date',
            'resultado_examen_ocupacional' => 'nullable|in:apto,no_apto,apto_con_restricciones',
        ]);

        // Verificar que el empleado esté activo
        $empleado = Empleado::find($validated['empleado_id']);
        if (!$empleado || $empleado->estado !== 'activo') {
            return response()->json([
                'error' => 'El empleado no está activo o no existe'
            ], 400);
        }

        // Verificar que no exista un conductor ACTIVO con este empleado
        $conductorActivo = Conductor::where('empleado_id', $validated['empleado_id'])
            ->where('estado', 'activo')
            ->first();
            
        if ($conductorActivo) {
            return response()->json([
                'error' => 'Este empleado ya está registrado como conductor activo'
            ], 400);
        }

        // Verificar si existe un conductor INACTIVO (para reactivar)
        $conductorInactivo = Conductor::where('empleado_id', $validated['empleado_id'])
            ->where('estado', 'inactivo')
            ->first();
            
        if ($conductorInactivo) {
            // Reactivar el conductor existente
            $conductorInactivo->update([
                'estado' => 'activo',
                'numero_licencia' => $validated['numero_licencia'],
                'clase_licencia' => $validated['clase_licencia'],
                'fecha_primera_licencia' => $validated['fecha_primera_licencia'],
                'fecha_vencimiento_licencia' => $validated['fecha_vencimiento_licencia'],
                'estado_licencia' => $validated['estado_licencia'],
                'anios_experiencia' => $validated['anios_experiencia'] ?? $conductorInactivo->anios_experiencia,
                'observaciones_licencia' => $validated['observaciones_licencia'] ?? $conductorInactivo->observaciones_licencia,
                'cantidad_infracciones' => $validated['cantidad_infracciones'] ?? $conductorInactivo->cantidad_infracciones,
                'cantidad_accidentes' => $validated['cantidad_accidentes'] ?? $conductorInactivo->cantidad_accidentes,
                'historial_sanciones' => $validated['historial_sanciones'] ?? $conductorInactivo->historial_sanciones,
                'fecha_ultima_revision_medica' => $validated['fecha_ultima_revision_medica'] ?? $conductorInactivo->fecha_ultima_revision_medica,
                'apto_conducir' => $validated['apto_conducir'] ?? $conductorInactivo->apto_conducir,
                'certificado_rcp' => $validated['certificado_rcp'] ?? $conductorInactivo->certificado_rcp,
                'vencimiento_rcp' => $validated['vencimiento_rcp'] ?? $conductorInactivo->vencimiento_rcp,
                'certificado_defensa' => $validated['certificado_defensa'] ?? $conductorInactivo->certificado_defensa,
                'vencimiento_defensa' => $validated['vencimiento_defensa'] ?? $conductorInactivo->vencimiento_defensa,
                'fecha_examen_ocupacional' => $validated['fecha_examen_ocupacional'] ?? $conductorInactivo->fecha_examen_ocupacional,
                'vencimiento_examen_ocupacional' => $validated['vencimiento_examen_ocupacional'] ?? $conductorInactivo->vencimiento_examen_ocupacional,
                'resultado_examen_ocupacional' => $validated['resultado_examen_ocupacional'] ?? $conductorInactivo->resultado_examen_ocupacional,
            ]);
            
            $conductorInactivo->load('empleado.user');
            
            return response()->json([
                'message' => 'Conductor reactivado exitosamente',
                'data' => $conductorInactivo
            ], 200);
        }

        // Crear nuevo conductor
        try {
            $conductor = Conductor::create([
                'empleado_id' => $validated['empleado_id'],
                'numero_licencia' => $validated['numero_licencia'],
                'clase_licencia' => $validated['clase_licencia'],
                'fecha_primera_licencia' => $validated['fecha_primera_licencia'],
                'fecha_vencimiento_licencia' => $validated['fecha_vencimiento_licencia'],
                'estado_licencia' => $validated['estado_licencia'],
                'estado' => $validated['estado'] ?? 'activo',
                'anios_experiencia' => $validated['anios_experiencia'] ?? 0,
                'observaciones_licencia' => $validated['observaciones_licencia'] ?? null,
                'cantidad_infracciones' => $validated['cantidad_infracciones'] ?? 0,
                'cantidad_accidentes' => $validated['cantidad_accidentes'] ?? 0,
                'historial_sanciones' => $validated['historial_sanciones'] ?? null,
                'fecha_ultima_revision_medica' => $validated['fecha_ultima_revision_medica'] ?? null,
                'apto_conducir' => $validated['apto_conducir'] ?? true,
                'certificado_rcp' => $validated['certificado_rcp'] ?? false,
                'vencimiento_rcp' => $validated['vencimiento_rcp'] ?? null,
                'certificado_defensa' => $validated['certificado_defensa'] ?? false,
                'vencimiento_defensa' => $validated['vencimiento_defensa'] ?? null,
                'fecha_examen_ocupacional' => $validated['fecha_examen_ocupacional'] ?? null,
                'vencimiento_examen_ocupacional' => $validated['vencimiento_examen_ocupacional'] ?? null,
                'resultado_examen_ocupacional' => $validated['resultado_examen_ocupacional'] ?? null,
            ]);

            $conductor->load('empleado.user');

            return response()->json([
                'message' => 'Conductor creado exitosamente',
                'data' => $conductor
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al crear conductor: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // PUT - Actualizar conductor
    // ============================================
    public function update(Request $request, $id)
    {
        $conductor = Conductor::find($id);
        
        if (!$conductor) {
            return response()->json(['error' => 'Conductor no encontrado'], 404);
        }

        $validated = $request->validate([
            'numero_licencia' => 'sometimes|string|unique:conductores,numero_licencia,' . $id,
            'clase_licencia' => 'sometimes|in:A,A2,A3,B,C,D,E',
            'fecha_primera_licencia' => 'sometimes|date',
            'fecha_vencimiento_licencia' => 'sometimes|date',
            'estado_licencia' => 'sometimes|in:vigente,vencida,suspendida',
            'anios_experiencia' => 'sometimes|integer|min:0',
            'estado' => 'sometimes|in:activo,licencia_medica,suspendido,inactivo',
            'observaciones_licencia' => 'sometimes|nullable|string|max:500',
            'cantidad_infracciones' => 'sometimes|integer|min:0',
            'cantidad_accidentes' => 'sometimes|integer|min:0',
            'historial_sanciones' => 'sometimes|nullable|string|max:1000',
            'fecha_ultima_revision_medica' => 'sometimes|nullable|date',
            'apto_conducir' => 'sometimes|boolean',
            'certificado_rcp' => 'sometimes|boolean',
            'vencimiento_rcp' => 'sometimes|nullable|date',
            'certificado_defensa' => 'sometimes|boolean',
            'vencimiento_defensa' => 'sometimes|nullable|date',
            'fecha_examen_ocupacional' => 'sometimes|nullable|date',
            'vencimiento_examen_ocupacional' => 'sometimes|nullable|date',
            'resultado_examen_ocupacional' => 'sometimes|nullable|in:apto,no_apto,apto_con_restricciones',
        ]);

        try {
            $conductor->update($validated);
            $conductor->load('empleado.user');

            return response()->json([
                'message' => 'Conductor actualizado exitosamente',
                'data' => $conductor
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar conductor: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // DELETE - Eliminar conductor
    // ============================================
    public function destroy($id)
    {
        $conductor = Conductor::find($id);
        
        if (!$conductor) {
            return response()->json(['error' => 'Conductor no encontrado'], 404);
        }

        try {
            $conductor->delete();
            return response()->json(['message' => 'Conductor eliminado exitosamente']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al eliminar conductor: ' . $e->getMessage()
            ], 500);
        }
    }
}