<?php

namespace App\Http\Controllers;

use App\Models\Bus;
use Illuminate\Http\Request;

class BusController extends Controller
{
    // GET - Obtener todos los buses
    public function index()
    {
        $buses = Bus::all();
        return response()->json($buses);
    }

    // GET - Obtener un bus específico
    public function show($id)
    {
        $bus = Bus::find($id);
        if (!$bus) {
            return response()->json(['error' => 'Bus no encontrado'], 404);
        }
        return response()->json($bus);
    }

    // POST - Crear nuevo bus
    public function store(Request $request)
    { 
        $bus = Bus::create([
        'patente' => $request->patente,
        'marca' => $request->marca,
        'modelo' => $request->modelo,
        'anio' => $request->anio,
        'capacidad' => $request->capacidad,
        'estado' => $request->estado,
        'proximaRevision' => $request->proximaRevision,
    ]);
    return response()->json($bus, 201);
}

    // PUT - Actualizar bus
    public function update(Request $request, $id)
    {
        $bus = Bus::find($id);
        if (!$bus) {
            return response()->json(['error' => 'Bus no encontrado'], 404);
        }
        
        $bus->update([
            'patente' => $request->patente,
            'marca' => $request->marca,
            'modelo' => $request->modelo,
            'anio' => $request->anio,
            'capacidad' => $request->capacidad,
            'estado' => $request->estado,
            'proximaRevision' => $request->proximaRevision,

        
        ]);

        return response()->json($bus);
    }

    // DELETE - Eliminar bus
    public function destroy($id)
    {
        $bus = Bus::find($id);
        if (!$bus) {
            return response()->json(['error' => 'Bus no encontrado'], 404);
        }

        $bus->delete();
        return response()->json(['message' => 'Bus eliminado']);
    }
}
