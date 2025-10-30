<?php

namespace App\Http\Controllers;

use App\Models\Bus;
use Illuminate\Http\Request;

class BusController extends Controller
{
    public function index()
    {
        $buses = Bus::all();
        return response()->json($buses);
    }

    public function show($id)
    {
        $bus = Bus::find($id);
        if (!$bus) {
            return response()->json(['error' => 'Bus no encontrado'], 404);
        }
        return response()->json($bus);
    }

    public function store(Request $request)
    {
        $bus = Bus::create([
            'patente' => $request->patente,
            'patente_verificador' => $request->patente_verificador,
            'marca' => $request->marca,
            'modelo' => $request->modelo,
            'anio' => $request->anio,
            'numero_serie' => $request->numero_serie,
            'numero_motor' => $request->numero_motor,
            'capacidad_pasajeros' => $request->capacidad_pasajeros,
            'fecha_adquisicion' => $request->fecha_adquisicion,
            'estado' => $request->estado ?? 'operativo',
            'proxima_revision_tecnica' => $request->proxima_revision_tecnica,
            'ultima_revision_tecnica' => $request->ultima_revision_tecnica,
            'documento_revision_tecnica' => $request->documento_revision_tecnica,
            'vencimiento_seguro' => $request->vencimiento_seguro,
            'numero_permiso_circulacion' => $request->numero_permiso_circulacion,
            'numero_soap' => $request->numero_soap,
            'observaciones' => $request->observaciones,
            'kilometraje_original' => $request->kilometraje_original ?? 0,
            'kilometraje_actual' => $request->kilometraje_actual ?? 0,
        ]);
        return response()->json($bus, 201);
    }

    public function update(Request $request, $id)
    {
        $bus = Bus::find($id);
        if (!$bus) {
            return response()->json(['error' => 'Bus no encontrado'], 404);
        }

        $bus->update([
            'patente' => $request->patente ?? $bus->patente,
            'patente_verificador' => $request->patente_verificador ?? $bus->patente_verificador,
            'marca' => $request->marca ?? $bus->marca,
            'modelo' => $request->modelo ?? $bus->modelo,
            'anio' => $request->anio ?? $bus->anio,
            'numero_serie' => $request->numero_serie ?? $bus->numero_serie,
            'numero_motor' => $request->numero_motor ?? $bus->numero_motor,
            'capacidad_pasajeros' => $request->capacidad_pasajeros ?? $bus->capacidad_pasajeros,
            'fecha_adquisicion' => $request->fecha_adquisicion ?? $bus->fecha_adquisicion,
            'estado' => $request->estado ?? $bus->estado,
            'proxima_revision_tecnica' => $request->proxima_revision_tecnica ?? $bus->proxima_revision_tecnica,
            'ultima_revision_tecnica' => $request->ultima_revision_tecnica ?? $bus->ultima_revision_tecnica,
            'documento_revision_tecnica' => $request->documento_revision_tecnica ?? $bus->documento_revision_tecnica,
            'vencimiento_seguro' => $request->vencimiento_seguro ?? $bus->vencimiento_seguro,
            'numero_permiso_circulacion' => $request->numero_permiso_circulacion ?? $bus->numero_permiso_circulacion,
            'numero_soap' => $request->numero_soap ?? $bus->numero_soap,
            'observaciones' => $request->observaciones ?? $bus->observaciones,
            'kilometraje_original' => $request->kilometraje_original ?? $bus->kilometraje_original,
            'kilometraje_actual' => $request->kilometraje_actual ?? $bus->kilometraje_actual,
        ]);

        return response()->json($bus);
    }

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