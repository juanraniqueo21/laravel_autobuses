<?php

namespace App\Http\Controllers;

use App\Models\Conductor;
use Illuminate\Http\Request;

class ConductorController extends Controller
{
    // GET - Obtener todos los conductores
    public function index()
    {
        $conductores = Conductor::all();
        return response()->json($conductores);
    }

    // GET - Obtener un conductor específico
    public function show($id)
    {
        $conductor = Conductor::find($id);
        if (!$conductor) {
            return response()->json(['error' => 'Conductor no encontrado'], 404);
        }
        return response()->json($conductor);
    }

    // POST - Crear nuevo conductor
    public function store(Request $request)
    {
        $conductor = Conductor::create([
            'empleado_id' => $request->empleado_id,
            'numero_licencia' => $request->numero_licencia,
            'clase_licencia' => $request->clase_licencia,
            'fecha_vencimiento_licencia' => $request->fecha_vencimiento_licencia,
            'puntos_licencia' => $request->puntos_licencia ?? 0,
            'estado' => $request->estado ?? 'activo',
        ]);
        return response()->json($conductor, 201);
    }

    // PUT - Actualizar conductor
    public function update(Request $request, $id)
    {
        $conductor = Conductor::find($id);
        if (!$conductor) {
            return response()->json(['error' => 'Conductor no encontrado'], 404);
        }

        $conductor->update([
            'empleado_id' => $request->empleado_id,
            'numero_licencia' => $request->numero_licencia,
            'clase_licencia' => $request->clase_licencia,
            'fecha_vencimiento_licencia' => $request->fecha_vencimiento_licencia,
            'puntos_licencia' => $request->puntos_licencia ?? $conductor->puntos_licencia,
            'estado' => $request->estado ?? $conductor->estado,
        ]);
        return response()->json($conductor);
    }

    // DELETE - Eliminar conductor
    public function destroy($id)
    {
        $conductor = Conductor::find($id);
        if (!$conductor) {
            return response()->json(['error' => 'Conductor no encontrado'], 404);
        }

        $conductor->delete();
        return response()->json(['message' => 'Conductor eliminado']);
    }
}
