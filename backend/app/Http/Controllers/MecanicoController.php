<?php

namespace App\Http\Controllers;

use App\Models\Mecanico;
use Illuminate\Http\Request;

class MecanicoController extends Controller
{
    public function index()
    {
        $mecanicos = Mecanico::with('empleado')->get();
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
            'empleado_id' => $request->empleado_id,
            'numero_certificacion' => $request->numero_certificacion,
            'especialidad' => $request->especialidad,
            'fecha_certificacion' => $request->fecha_certificacion,
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

        $mecanico->update([
            'empleado_id' => $request->empleado_id ?? $mecanico->empleado_id,
            'numero_certificacion' => $request->numero_certificacion ?? $mecanico->numero_certificacion,
            'especialidad' => $request->especialidad ?? $mecanico->especialidad,
            'fecha_certificacion' => $request->fecha_certificacion ?? $mecanico->fecha_certificacion,
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