<?php

namespace App\Http\Controllers;

use App\Models\Asistente;
use App\Models\Empleado;
use Illuminate\Http\Request;

class AsistenteController extends Controller
{
    // ============================================
    // GET - Obtener todos los asistentes
    // ============================================
    public function index()
    {
        $asistentes = Asistente::with('empleado.user')->get();
        return response()->json($asistentes);
    }

    // ============================================
    // GET - Obtener un asistente específico
    // ============================================
    public function show($id)
    {
        $asistente = Asistente::with('empleado.user')->find($id);
        
        if (!$asistente) {
            return response()->json(['error' => 'Asistente no encontrado'], 404);
        }
        
        return response()->json($asistente);
    }

    // ============================================
    // POST - Crear nuevo asistente
    // ============================================
    public function store(Request $request)
    {
        // Validar datos de entrada
        $validated = $request->validate([
            'empleado_id' => 'required|exists:empleados,id',
            'fecha_inicio' => 'nullable|date',
            'fecha_termino' => 'nullable|date|after:fecha_inicio',
            'fecha_examen_ocupacional' => 'nullable|date',
            'estado' => 'nullable|in:activo,inactivo,licencia_medica,suspendido',
            'observaciones' => 'nullable|string|max:500',
        ]);

        // Verificar que el empleado esté activo
        $empleado = Empleado::find($validated['empleado_id']);
        if (!$empleado || $empleado->estado !== 'activo') {
            return response()->json([
                'error' => 'El empleado no está activo o no existe'
            ], 400);
        }

        // Verificar que no exista un asistente ACTIVO con este empleado
        $asistenteActivo = Asistente::where('empleado_id', $validated['empleado_id'])
            ->where('estado', 'activo')
            ->first();
            
        if ($asistenteActivo) {
            return response()->json([
                'error' => 'Este empleado ya está registrado como asistente activo'
            ], 400);
        }

        // Verificar si existe un asistente INACTIVO (para reactivar)
        $asistenteInactivo = Asistente::where('empleado_id', $validated['empleado_id'])
            ->where('estado', 'inactivo')
            ->first();
            
        if ($asistenteInactivo) {
            // Reactivar el asistente existente
            $asistenteInactivo->update([
                'estado' => 'activo',
                'fecha_inicio' => $validated['fecha_inicio'] ?? $asistenteInactivo->fecha_inicio,
                'fecha_termino' => $validated['fecha_termino'] ?? null,
                'fecha_examen_ocupacional' => $validated['fecha_examen_ocupacional'] ?? $asistenteInactivo->fecha_examen_ocupacional,
                'observaciones' => $validated['observaciones'] ?? $asistenteInactivo->observaciones,
            ]);
            
            $asistenteInactivo->load('empleado.user');
            
            return response()->json([
                'message' => 'Asistente reactivado exitosamente',
                'data' => $asistenteInactivo
            ], 200);
        }

        // Crear nuevo asistente
        try {
            $asistente = Asistente::create([
                'empleado_id' => $validated['empleado_id'],
                'fecha_inicio' => $validated['fecha_inicio'] ?? null,
                'fecha_termino' => $validated['fecha_termino'] ?? null,
                'fecha_examen_ocupacional' => $validated['fecha_examen_ocupacional'] ?? null,
                'estado' => $validated['estado'] ?? 'activo',
                'observaciones' => $validated['observaciones'] ?? null,
            ]);

            $asistente->load('empleado.user');

            return response()->json([
                'message' => 'Asistente creado exitosamente',
                'data' => $asistente
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al crear asistente: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // PUT - Actualizar asistente
    // ============================================
    public function update(Request $request, $id)
    {
        $asistente = Asistente::find($id);
        
        if (!$asistente) {
            return response()->json(['error' => 'Asistente no encontrado'], 404);
        }

        $validated = $request->validate([
            'fecha_inicio' => 'sometimes|nullable|date',
            'fecha_termino' => 'sometimes|nullable|date|after:fecha_inicio',
            'fecha_examen_ocupacional' => 'sometimes|nullable|date',
            'estado' => 'sometimes|nullable|in:activo,inactivo,licencia_medica,suspendido',
            'observaciones' => 'sometimes|nullable|string|max:500',
        ]);

        try {
            $asistente->update($validated);
            $asistente->load('empleado.user');

            return response()->json([
                'message' => 'Asistente actualizado exitosamente',
                'data' => $asistente
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar asistente: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // DELETE - Eliminar asistente
    // ============================================
    public function destroy($id)
    {
        $asistente = Asistente::find($id);
        
        if (!$asistente) {
            return response()->json(['error' => 'Asistente no encontrado'], 404);
        }

        try {
            $asistente->delete();
            return response()->json(['message' => 'Asistente eliminado exitosamente']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al eliminar asistente: ' . $e->getMessage()
            ], 500);
        }
    }
}