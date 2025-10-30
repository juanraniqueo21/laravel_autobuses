<?php

namespace App\Http\Controllers;

use App\Models\Viaje;
use Illuminate\Http\Request;

class ViajeController extends Controller
{
    public function index()
    {
        $viajes = Viaje::with('bus', 'conductor', 'asistente', 'ruta')->get();
        return response()->json($viajes);
    }

    public function show($id)
    {
        $viaje = Viaje::with('bus', 'conductor', 'asistente', 'ruta')->find($id);
        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }
        return response()->json($viaje);
    }

    public function store(Request $request)
    {
        $viaje = Viaje::create([
            'bus_id' => $request->bus_id,
            'conductor_id' => $request->conductor_id,
            'asistente_id' => $request->asistente_id,
            'ruta_id' => $request->ruta_id,
            'fecha_hora_salida' => $request->fecha_hora_salida,
            'fecha_hora_llegada' => $request->fecha_hora_llegada,
            'pasajeros_transportados' => $request->pasajeros_transportados,
            'combustible_gastado' => $request->combustible_gastado,
            'kilometraje_inicial' => $request->kilometraje_inicial,
            'kilometraje_final' => $request->kilometraje_final,
            'estado' => $request->estado ?? 'programado',
            'observaciones' => $request->observaciones,
            'incidentes' => $request->incidentes,
        ]);
        return response()->json($viaje, 201);
    }

    public function update(Request $request, $id)
    {
        $viaje = Viaje::find($id);
        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }

        $viaje->update([
            'bus_id' => $request->bus_id ?? $viaje->bus_id,
            'conductor_id' => $request->conductor_id ?? $viaje->conductor_id,
            'asistente_id' => $request->asistente_id ?? $viaje->asistente_id,
            'ruta_id' => $request->ruta_id ?? $viaje->ruta_id,
            'fecha_hora_salida' => $request->fecha_hora_salida ?? $viaje->fecha_hora_salida,
            'fecha_hora_llegada' => $request->fecha_hora_llegada ?? $viaje->fecha_hora_llegada,
            'pasajeros_transportados' => $request->pasajeros_transportados ?? $viaje->pasajeros_transportados,
            'combustible_gastado' => $request->combustible_gastado ?? $viaje->combustible_gastado,
            'kilometraje_inicial' => $request->kilometraje_inicial ?? $viaje->kilometraje_inicial,
            'kilometraje_final' => $request->kilometraje_final ?? $viaje->kilometraje_final,
            'estado' => $request->estado ?? $viaje->estado,
            'observaciones' => $request->observaciones ?? $viaje->observaciones,
            'incidentes' => $request->incidentes ?? $viaje->incidentes,
        ]);

        return response()->json($viaje);
    }

    public function destroy($id)
    {
        $viaje = Viaje::find($id);
        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }

        $viaje->delete();
        return response()->json(['message' => 'Viaje eliminado']);
    }
}