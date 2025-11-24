<?php

namespace App\Http\Controllers;

use App\Models\Mecanico;
use App\Models\Empleado;
use Illuminate\Http\Request;

class MecanicoController extends Controller
{
    public function index()
    {
        $mecanicos = Mecanico::with('empleado.user')->get();
        return response()->json($mecanicos);
    }

    public function show($id)
    {
        $mecanico = Mecanico::with('empleado')->find($id);
        if (!$mecanico) {
            return response()->json(['error' => 'Mecánico no encontrado'], 404);
        }
        return response()->json($mecanico);
    }

    public function store(Request $request)
    {
        // 1. Validar los datos entrantes
        $validated = $request->validate([
            'empleado_id' => 'required|exists:empleados,id|unique:mecanicos,empleado_id',
            'especialidad' => 'required|array', // IMPORTANTE: Debe ser array
            'numero_certificacion' => 'nullable|string',
            'fecha_certificacion' => 'nullable|date',
            'fecha_examen_ocupacional' => 'nullable|date',
            'estado' => 'in:activo,inactivo,suspendido',
            'observaciones' => 'nullable|string',
        ]);

        // 2. Verificar lógica de negocio (Empleado activo)
        $empleado = Empleado::find($request->empleado_id);
        if (!$empleado || $empleado->estado !== 'activo') {
            return response()->json([
                'error' => 'El empleado no está activo o no existe'
            ], 400);
        }

        // 3. Crear el mecánico
        $mecanico = Mecanico::create([
            'empleado_id' => $request->empleado_id,
            'numero_certificacion' => $request->numero_certificacion,
            'especialidad' => $request->especialidad, // El Modelo lo convierte a JSON automáticamente
            'fecha_certificacion' => $request->fecha_certificacion,
            'fecha_examen_ocupacional' => $request->fecha_examen_ocupacional,
            'estado' => $request->estado ?? 'activo',
            'observaciones' => $request->observaciones,
        ]);

        return response()->json($mecanico, 201);
    }

    public function update(Request $request, $id)
    {
        $mecanico = Mecanico::find($id);
        if (!$mecanico) {
            return response()->json(['error' => 'Mecánico no encontrado'], 404);
        }

        // Validar datos para actualización
        $request->validate([
            'empleado_id' => 'exists:empleados,id|unique:mecanicos,empleado_id,' . $id,
            'especialidad' => 'nullable|array', // IMPORTANTE
            'estado' => 'in:activo,inactivo,suspendido',
        ]);

        $mecanico->update([
            'empleado_id' => $request->empleado_id ?? $mecanico->empleado_id,
            'numero_certificacion' => $request->numero_certificacion ?? $mecanico->numero_certificacion,
            'especialidad' => $request->especialidad ?? $mecanico->especialidad,
            'fecha_certificacion' => $request->fecha_certificacion ?? $mecanico->fecha_certificacion,
            'fecha_examen_ocupacional' => $request->fecha_examen_ocupacional ?? $mecanico->fecha_examen_ocupacional,
            'estado' => $request->estado ?? $mecanico->estado,
            'observaciones' => $request->observaciones ?? $mecanico->observaciones,
        ]);

        return response()->json($mecanico);
    }

    public function destroy($id)
    {
        $mecanico = Mecanico::find($id);
        if (!$mecanico) {
            return response()->json(['error' => 'Mecánico no encontrado'], 404);
        }

        $mecanico->delete();
        return response()->json(['message' => 'Mecánico eliminado']);
    }
}