<?php

namespace App\Http\Controllers;

use App\Models\Ruta;
use Illuminate\Http\Request;

class RutaController extends Controller
{
    public function index()
    {
        $rutas = Ruta::all();
        return response()->json($rutas);
    }

    public function show($id)
    {
        $ruta = Ruta::find($id);
        if (!$ruta) {
            return response()->json(['error' => 'Ruta no encontrada'], 404);
        }
        return response()->json($ruta);
    }

    public function store(Request $request)
    {
        $ruta = Ruta::create([
            'nombre_ruta' => $request->nombre_ruta,
            'codigo_ruta' => $request->codigo_ruta,
            'punto_salida' => $request->punto_salida,
            'punto_destino' => $request->punto_destino,
            'distancia_km' => $request->distancia_km,
            'tiempo_estimado_minutos' => $request->tiempo_estimado_minutos,
            'descripcion' => $request->descripcion,
            'paradas' => $request->paradas,
            'estado' => $request->estado ?? 'activa',
            'tarifa' => $request->tarifa,
        ]);
        return response()->json($ruta, 201);
    }

    public function update(Request $request, $id)
    {
        $ruta = Ruta::find($id);
        if (!$ruta) {
            return response()->json(['error' => 'Ruta no encontrada'], 404);
        }

        $ruta->update([
            'nombre_ruta' => $request->nombre_ruta ?? $ruta->nombre_ruta,
            'codigo_ruta' => $request->codigo_ruta ?? $ruta->codigo_ruta,
            'punto_salida' => $request->punto_salida ?? $ruta->punto_salida,
            'punto_destino' => $request->punto_destino ?? $ruta->punto_destino,
            'distancia_km' => $request->distancia_km ?? $ruta->distancia_km,
            'tiempo_estimado_minutos' => $request->tiempo_estimado_minutos ?? $ruta->tiempo_estimado_minutos,
            'descripcion' => $request->descripcion ?? $ruta->descripcion,
            'paradas' => $request->paradas ?? $ruta->paradas,
            'estado' => $request->estado ?? $ruta->estado,
            'tarifa' => $request->tarifa ?? $ruta->tarifa,
        ]);

        return response()->json($ruta);
    }

    public function destroy($id)
    {
        $ruta = Ruta::find($id);
        if (!$ruta) {
            return response()->json(['error' => 'Ruta no encontrada'], 404);
        }

        $ruta->delete();
        return response()->json(['message' => 'Ruta eliminada']);
    }
}