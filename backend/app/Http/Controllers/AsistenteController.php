<?php

namespace App\Http\Controllers;

use App\Models\Asistente;
use Illuminate\Http\Request;

class AsistenteController extends Controller
{
    public function index()
    {
        $asistentes = Asistente::with('empleado.user')->get();
        return response()->json($asistentes);
    }

    public function show($id)
    {
        $asistente = Asistente::with('empleado')->find($id);
        if (!$asistente) {
            return response()->json(['error' => 'Asistente no encontrado'], 404);
        }
        return response()->json($asistente);
    }

    public function store(Request $request)
    {
        $asistente = Asistente::create([
            'empleado_id' => $request->empleado_id,
            'fecha_inicio' => $request->fecha_inicio,
            'fecha_termino' => $request->fecha_termino,
            'fecha_examen_ocupacional' => $request->fecha_examen_ocupacional,
            'estado' => $request->estado ?? 'activo',
            'observaciones' => $request->observaciones,
        ]);
        return response()->json($asistente, 201);
    }

    public function update(Request $request, $id)
    {
        $asistente = Asistente::find($id);
        if (!$asistente) {
            return response()->json(['error' => 'Asistente no encontrado'], 404);
        }

        $asistente->update([
            'empleado_id' => $request->empleado_id ?? $asistente->empleado_id,
            'fecha_inicio' => $request->fecha_inicio ?? $asistente->fecha_inicio,
            'fecha_termino' => $request->fecha_termino ?? $asistente->fecha_termino,
            'fecha_examen_ocupacional' => $request->fecha_examen_ocupacional ?? $asistente->fecha_examen_ocupacional,
            'estado' => $request->estado ?? $asistente->estado,
            'observaciones' => $request->observaciones ?? $asistente->observaciones,
        ]);

        return response()->json($asistente);
    }

    public function destroy($id)
    {
        $asistente = Asistente::find($id);
        if (!$asistente) {
            return response()->json(['error' => 'Asistente no encontrado'], 404);
        }

        $asistente->delete();
        return response()->json(['message' => 'Asistente eliminado']);
    }
}