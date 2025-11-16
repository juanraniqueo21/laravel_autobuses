<?php

namespace App\Http\Controllers;

use App\Models\Mecanico;
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
        $mecanico = Mecanico::create([
            'empleado_id' => 'required|exists:empleados,id',
            'numero_certificacion' => $request->numero_certificacion,
            'especialidad' => $request->especialidad,
            'fecha_certificacion' => $request->fecha_certificacion,
            'fecha_examen_ocupacional' => $request->fecha_examen_ocupacional,
            'estado' => $request->estado ?? 'activo',
            'observaciones' => $request->observaciones,
        ]);
        // verificar que el empleado este activo
        $empleado = \App\Models\Empleado::find($validated['empleado_id']);
        if (!$empleado || $empleado->estado !== 'activo') {
            return response()->json([
                'error' => 'El empleado no esta activo o no existe'
            ], 400);
        }
        // verificar que no esxita un mecanico activo con este empleado
        $mecanicoActivo = Mecanico::where('empleado_id', $validated['empleado_id'])
            ->where('estado', 'activo')
            ->first();
            if ($mecanicoActivo) {
                return response()->json([
                    'error' => 'Ya existe un mecánico activo con este empleado'
                ], 400);
            }
        return response()->json($mecanico, 201);
    }

    public function update(Request $request, $id)
    {
        $mecanico = Mecanico::find($id);
        if (!$mecanico) {
            return response()->json(['error' => 'Mecánico no encontrado'], 404);
        }

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